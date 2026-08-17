# Nest 사용 규칙

## 의존성 주입

- 🔴 **생성자 주입만 사용한다.** property 주입(`@Inject()` 필드)은 금지.
- 🔴 provider는 반드시 모듈의 `providers`에 등록한다.
- 🟡 `exports`는 최소한으로. 외부에 필요한 것만 내보낸다.
- 🟡 한 클래스가 주입받는 의존성이 **4개를 넘으면** 책임이 과하다는 신호. 분리를 검토한다.

```ts
// ✅ 생성자 주입
@Injectable()
export class ArticleCommandService {
  constructor(
    @Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
  ) {}
}
```

- 🔴 주입받은 의존성은 `private readonly`로 선언한다.

## 각 장치를 어디에 쓰나

| 장치 | 용도 | 예시 |
|---|---|---|
| Pipe | 요청 데이터 검증/변환 | DTO 스키마 검증 |
| Guard | 인증/권한 | JWT 검증, 역할 확인 |
| Interceptor | 응답 형식 통일, 로깅 | `{ code, message, result }` 봉투 래핑 |
| Exception Filter | 도메인 예외 → HTTP 응답 변환 | `ArticleNotFoundException` → 404 |
| Middleware | HTTP 레벨 관심사 | CORS, 요청 로깅 |

- 🔴 Service는 HTTP를 몰라야 한다. `HttpException`을 직접 던지지 않는다.
- 🔴 도메인 예외는 전용 클래스로 던진다. 문자열/generic Error 금지.

```ts
// ❌ Service가 HTTP를 안다
throw new HttpException('게시글을 찾을 수 없습니다', 404)
throw new Error('not found')

// ✅ 도메인 예외를 던지고, 필터가 HTTP로 변환한다
throw new ArticleNotFoundException()
```

## 응답 형식 (🔴 강제)

- 모든 성공 응답은 전역 인터셉터가 감싸고, 에러 응답은 전역 예외 필터가 만든다. **Controller는 순수 데이터만 반환한다.**
- 구체적인 응답/에러 형태와 에러 코드 체계의 단일 기준은 [API 계약](../foundation/api-contract.md)이다.
