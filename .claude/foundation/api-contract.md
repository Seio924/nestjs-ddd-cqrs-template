# API 계약 (응답 · 에러 · 검증)

> 기준: 응답/에러 상세 원칙은 [`../architecture/design-principles.md`](../architecture/design-principles.md) §8 + [`../architecture/error-handling.md`](../architecture/error-handling.md).

## 응답 형식 — `{ code, message, result }` 봉투

전역 `ResponseInterceptor`가 성공 응답을 봉투로 감싼다. **Controller는 순수 데이터(DTO)만 반환**한다.

```jsonc
// 성공
{ "code": "SUCCESS", "message": "요청 성공", "result": { ... } }
// 실패 (성공과 같은 껍데기, result=null)
{ "code": "ARTICLE_NOT_FOUND", "message": "...", "result": null }
```

- HTTP 상태코드는 정직하게 사용(200/201/204/4xx/5xx). 프론트는 `code`로 분기(메시지 텍스트 의존 금지).
- **페이지네이션**: `result` 안에 **도메인 복수형 키**로(`result: { articles: [...], count }` 또는 `{ ..., nextCursor, hasNext }`). 제네릭 키(`data`/`items`) 금지. 상세는 [`../architecture/pagination.md`](../architecture/pagination.md).
- `204 No Content`처럼 바디 없는 경우는 래핑하지 않는다.

## 에러 처리

**흐름**: 도메인 예외 클래스(`BaseException` 상속) throw → command·controller 통과 → 전역 `AllExceptionsFilter`가 봉투로 변환. 상세·예시는 [`error-handling.md`](../architecture/error-handling.md).

| 예외 종류 | status | code | result |
|---|---|---|---|
| `BaseException`(도메인 예외) | 예외의 `status` | 예외의 `code` | `null` |
| 검증 실패(ValidationPipe) | 400 | `VALIDATION_FAILED` | `[{ field, rules }]` |
| 그 외 프레임워크 HttpException(라우트 없음 404 등) | 예외의 status 유지 | `COMMON_HTTP_ERROR` | `null` |
| 그 외 미처리 | 500 | `INTERNAL_ERROR`(원본 로깅, 메시지 일반화) | `null` |

**에러 코드 체계**: `<DOMAIN>_<REASON>` `UPPER_SNAKE_CASE`(예: `ARTICLE_NOT_FOUND`).
- 코드·메시지 상수는 도메인당 `<domain>-error-code.ts`·`<domain>-error-message.ts`, 예외 클래스는 `<domain>-exceptions.ts` 한 파일에 모음.

## 검증

- 전역 `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- 요청 바디/쿼리/파라미터는 **DTO 클래스 + class-validator**로만 받는다.
- DTO 위치: `<domain>/interface/dto/`, 파일명은 `-request-body.ts`/`-response-body.ts` 등.
