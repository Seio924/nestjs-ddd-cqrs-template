> 🌐 [한국어](./overview.md) · **English**

# Overview & Project Skeleton

This document is the spec for the **foundation that doesn't change regardless of feature domains** (cross-cutting concerns + auth skeleton).
Code rules follow [Code Conventions](../conventions/architecture.en.md); this document defines "what to set up and how."

---

## Stack & versions

| Item | Choice |
|---|---|
| Runtime | Node 22 LTS |
| Package manager | pnpm |
| Framework | NestJS 11 |
| Language | TypeScript 5.x (`strict`) |
| ORM | **TypeORM** (MySQL) |
| Validation | class-validator + class-transformer |
| Auth | `@nestjs/jwt` + Passport (JWT strategy) — verification skeleton (issuance is done in the project) |
| Logging | nestjs-pino |
| Docs | @nestjs/swagger |
| Testing | Jest + Supertest |
| Transactions | typeorm-transactional (`@Transactional()`) |

---

## Folder structure

```
src/
  main.ts                     # bootstrap (global pipe·filter·interceptor·swagger·security)
  app-module.ts
  common/                     # envelope interceptor·exception filter·BaseException·global guard·decorators·pipe·logging·security·swagger
  config/                     # environment variable validation (fail-fast)
  database/                   # TypeORM DataSource + migrations
  <domain>/                   # per-domain 4 layers (interface/application/domain/infrastructure)
    article/                  # sample domain
```

> The details and naming of the domain-internal 4 layers follow [directory-structure](../architecture/directory-structure.en.md).

---

## Bootstrap order

1. App creation + config/env validation + TypeORM DataSource + `initializeTransactionalContext()`
2. Cross-cutting: ResponseInterceptor · AllExceptionsFilter · BaseException · ValidationPipe · pino · helmet/CORS/throttler
3. Auth: global JwtAuthGuard + `@Public`/`@CurrentUser` (token verification skeleton — login/issuance implemented in the project)
4. Add domain modules (see the `article` sample)
5. Expose Swagger `/docs`

---

## What you fill in when extending

- Auth issuance flow (login·refresh·social) — implement per project requirements
- Feature domains — add by copying the `article` sample
- Deployment infrastructure — per project
