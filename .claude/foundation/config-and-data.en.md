> 🌐 [한국어](./config-and-data.md) · **English**

# Configuration & Data (Environment Variables · Transactions)

## Configuration / environment variables

- Register `@nestjs/config` globally. Environment variables are **schema-validated at boot** (class-validator), and any missing/malformed value makes the app **fail to start** (fail-fast).
- Direct `process.env` access in code is forbidden → only via injection of the validated `EnvSchema` instance.

```ts
// config/env-validation.ts (gist)
export class EnvSchema {
  @IsIn(['development', 'test', 'production']) NODE_ENV = 'development';
  @IsNumber() PORT = 4000;
  @IsString() DATABASE_URL!: string;      // TypeORM connection
  @IsString() WEB_ORIGIN!: string;        // CORS allowed origins (comma-separated, multiple allowed)
  @IsString() JWT_ACCESS_SECRET!: string; // auth guard
}
```

## CORS

```ts
// main.ts
app.enableCors({ origin: env.webOrigins, credentials: true });
```
- Allowed origins are injected via `WEB_ORIGIN` (env) — per-environment values come from deployment config.

---

## Transactions

- Use the `@Transactional()` decorator (`typeorm-transactional`) — the same experience as Spring's `@Transactional` (AsyncLocalStorage/CLS). It doesn't pass tx/manager as a parameter, so the **repository signatures stay clean**.
- Call `initializeTransactionalContext()` **once** in `main.ts` before bootstrap.
- Transaction boundary = business unit, **owned by application (the command service)** (cross-domain atomicity lives here too).
- ✅ Self-invocation within the same class is also transactional — because typeorm-transactional replaces the prototype method in-place (unlike a Spring AOP proxy).
- Details in [repository-pattern](../architecture/repository-pattern.en.md).
