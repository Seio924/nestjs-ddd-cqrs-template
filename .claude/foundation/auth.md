# 인증 (가드 골격)

> 이 템플릿은 **인증의 골격(토큰 검증 + 전역 가드)** 만 제공한다.
> 토큰 **발급**(로그인·refresh 회전·소셜 로그인)은 프로젝트마다 정책이 달라 포함하지 않는다 — 아래 가드 위에 얹어 구현한다.

## 제공되는 것

- **전역 `JwtAuthGuard`** — 모든 라우트가 기본적으로 인증 필요.
- **`@Public()`** — 공개 엔드포인트만 명시적으로 연다(안전한 기본값: 실수로 막히는 방향).
- **`@CurrentUser()`** — 인증 유저 주입(수동 `req.user` 접근 지양).
- **JWT 전략**(`passport-jwt`) — `Authorization: Bearer` 헤더의 access 토큰을 **서명·만료만** 검증(stateless, DB 조회 없음). 시크릿은 `JWT_ACCESS_SECRET`.

```ts
@Public()
@Post('login')
login(@Body() dto: LoginRequestBody) { /* 발급 로직은 프로젝트에서 */ }

@Get('me')
me(@CurrentUser() user: AuthUser) { ... }  // 가드 통과 필수
```

## JWT 코드의 레이어 배치 (발급을 구현할 때)

`@nestjs/jwt`/`jsonwebtoken`을 import하는 코드 = **infrastructure**. 발급 정책(무엇을 담을지)은 **application**, 요청 인증은 **common**의 가드.

| 하는 일 | 레이어 |
|---|---|
| JWT 서명/검증(crypto) | infrastructure (`TokenSigner` 포트 뒤) |
| 발급 정책(뭘 담고 언제) | application |
| 요청 인증(토큰 읽기) | common (전역 `JwtAuthGuard`) |

## 확장 시 결정할 것 (프로젝트별)

- 로그인/회원가입 흐름, refresh 토큰 회전·재사용 감지
- 소셜 로그인(provider 토큰 검증)
- 쿠키 vs Bearer, CSRF, 세션 저장소 등 — 배포 형태(BFF·모바일 등)에 따라 결정
