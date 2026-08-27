> 🌐 [한국어](./auth.md) · **English**

# Authentication (guard skeleton)

> This template provides **only the authentication skeleton (token verification + global guard)**.
> Token **issuance** (login·refresh rotation·social login) is not included, since the policy differs per project — build it on top of the guard below.

## What is provided

- **Global `JwtAuthGuard`** — every route requires authentication by default.
- **`@Public()`** — explicitly opens only public endpoints (safe default: fails toward being locked, not open).
- **`@CurrentUser()`** — injects the authenticated user (avoid manual `req.user` access).
- **JWT strategy** (`passport-jwt`) — verifies **only the signature and expiry** of the access token in the `Authorization: Bearer` header (stateless, no DB lookup). The secret is `JWT_ACCESS_SECRET`.

```ts
@Public()
@Post('login')
login(@Body() dto: LoginRequestBody) { /* 발급 로직은 프로젝트에서 */ }

@Get('me')
me(@CurrentUser() user: AuthUser) { ... }  // 가드 통과 필수
```

## Layer placement of JWT code (when you implement issuance)

Code that imports `@nestjs/jwt`/`jsonwebtoken` = **infrastructure**. Issuance policy (what to embed) = **application**, and request authentication = the guard in **common**.

| What it does | Layer |
|---|---|
| JWT signing/verification (crypto) | infrastructure (behind the `TokenSigner` port) |
| Issuance policy (what to embed and when) | application |
| Request authentication (reading the token) | common (global `JwtAuthGuard`) |

## Decisions to make when extending (per project)

- Login/signup flow, refresh token rotation·reuse detection
- Social login (provider token verification)
- Cookie vs Bearer, CSRF, session store, etc. — decided based on the deployment shape (BFF·mobile, etc.)
