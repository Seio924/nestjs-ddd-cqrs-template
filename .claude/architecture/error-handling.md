# 에러 처리

> 에러가 도메인에서 HTTP 응답까지 흐르는 방식. 응답 형식은 [design-principles.md](./design-principles.md) §8 참고.
> 방식: 도메인 예외 클래스 + 전역 필터. 도메인 예외가 자기 code·status·message를 들고 다니므로 controller가 매핑 코드를 반복할 필요 없이 전역 필터가 자동 처리한다.

---

## 1. 에러 흐름

```
① domain/service   도메인 예외 클래스 throw (BaseException 상속)
      ↓
② command service  안 잡고 통과
      ↓
③ controller       안 잡음 (catch 없음)
      ↓
④ 전역 예외 필터    예외의 code·status·message를 읽어 응답 형식으로 변환
```

핵심: **예외가 자기 code·status·message를 들고 있어서, controller는 아무것도 안 하고 전역 필터가 자동 처리**한다.

---

## 2. 도메인 예외 클래스 (BaseException)

```ts
// common/exceptions/base-exception.ts
export abstract class BaseException extends Error {
  abstract readonly code: string;    // 에러 코드 (<DOMAIN>_<REASON>)
  abstract readonly status: number;  // HTTP 상태
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
```

**에러는 도메인당 파일 3종**으로 모은다(파일 폭발 방지 + 매직스트링 금지):

```
article/
  article-error-code.ts      # 코드 상수 (SCREAMING_SNAKE)
  article-error-message.ts   # 메시지 문자열
  article-exceptions.ts      # 예외 클래스들(한 파일, 여러 개) — 위 상수 참조
```

```ts
// article-error-code.ts
export const ArticleErrorCode = {
  NOT_FOUND: 'ARTICLE_NOT_FOUND',
  ALREADY_PUBLISHED: 'ARTICLE_ALREADY_PUBLISHED',
} as const;

// article-exceptions.ts   ← 도메인당 파일 하나에 여러 예외 클래스
export class ArticleNotFoundException extends BaseException {
  readonly code = ArticleErrorCode.NOT_FOUND;      // 매직스트링 X (상수 참조)
  readonly status = 404;
  constructor() { super(ArticleErrorMessage.NOT_FOUND); }
}
export class ArticleAlreadyPublishedException extends BaseException {
  readonly code = ArticleErrorCode.ALREADY_PUBLISHED;
  readonly status = 409;
  constructor() { super(ArticleErrorMessage.ALREADY_PUBLISHED); }
}
// ... 이 도메인의 예외를 쭉
```

- **에러마다 파일 하나 만들지 않는다.** 예외 클래스는 도메인당 `<domain>-exceptions.ts` 하나에 모은다.
- 코드·메시지는 `<domain>-error-code.ts`·`<domain>-error-message.ts` 상수로 둔다(매직스트링 금지).
- 에러 코드: `<DOMAIN>_<REASON>` SCREAMING_SNAKE_CASE, 전역 유일.

---

## 3. 도메인/서비스에서 던지기

```ts
// domain/article.ts — 규칙 위반 시
if (this._status !== ArticleStatus.DRAFT) throw new ArticleAlreadyPublishedException();

// application/command/article-command-service.ts — 배선 가드
const article = await this.articleRepo.findById(id);
if (!article) throw new ArticleNotFoundException();
```

- 도메인·애플리케이션은 **도메인 예외 클래스만** 던진다. plain `Error`·`HttpException` 금지.
- 도메인 예외는 **HTTP를 (거의) 모른다.** `status`는 "심각도" 수준으로만 보유(실용 타협).

---

## 4. Controller — 아무것도 안 함

```ts
@Get(':id')
async get(@Param('id') id: string): Promise<ArticleResponseBody> {
  return ArticleResponseBody.of(await this.articleQueryService.getArticle(id)); // 예외 나면 그냥 통과
}
```

- `.catch()` 없음. 예외는 전역 필터로 흘러간다. 도메인 예외가 code·status·message를 이미 들고 있어 controller에서 매핑할 게 없다.

---

## 5. 전역 예외 필터 + 응답 형식

응답 형식은 봉투 `{ code, message, result }` 를 따른다.

```ts
// common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 1) 도메인 예외 → code·status·message 그대로
    if (exception instanceof BaseException) {
      return res.status(exception.status).json({
        code: exception.code, message: exception.message, result: null,
      });
    }
    // 2) 검증 실패 → VALIDATION_FAILED + 필드·규칙 코드
    if (exception instanceof ValidationException) {
      return res.status(400).json({
        code: 'VALIDATION_FAILED', message: '입력값이 올바르지 않습니다',
        result: exception.fieldErrors, // [{ field: 'title', rules: ['isString'] }]
      });
    }
    // 3) 그 외 프레임워크 HttpException (라우트 없음 404 등) → 상태코드 유지
    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        code: 'COMMON_HTTP_ERROR', message: exception.message, result: null,
      });
    }
    // 4) 그 외 미처리 → INTERNAL_ERROR (스택 노출 방지)
    return res.status(500).json({
      code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다', result: null,
    });
  }
}
```

| 응답 케이스 | code | status |
|---|---|---|
| 도메인 예외 | 예외의 `code` | 예외의 `status` |
| 검증 실패 | `VALIDATION_FAILED` (+ result에 `[{ field, rules }]`) | 400 |
| 그 외 프레임워크 HttpException (라우트 없음 404 등) | `COMMON_HTTP_ERROR` | 예외의 status 유지 |
| 미처리 예외 | `INTERNAL_ERROR` (원본은 로깅, 메시지 일반화) | 500 |

실패 응답 예:
```jsonc
{ "code": "ARTICLE_NOT_FOUND", "message": "게시글을 찾을 수 없습니다", "result": null }
```

---

## 6. 한 줄 요약

> 도메인 예외 클래스가 code·status·message를 들고 throw → command·controller는 통과 → 전역 필터가 `{ code, message, result }`로 자동 변환. 예외는 도메인당 한 파일(`<domain>-exceptions.ts`)에 모아 파일 폭발을 막는다. plain Error·HttpException을 도메인/서비스에서 던지지 않는다.
