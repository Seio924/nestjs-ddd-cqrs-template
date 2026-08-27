English · [한국어](./README.ko.md)

# nestjs-ddd-cqrs-template

> A NestJS + TypeORM backend starter that pre-wires **Rich Domain 4-Layer · CQRS · envelope responses**.
> For teams that stay on a **monolith + single DB** (no microservices) but still want real domain boundaries and layered rules.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803)

Start a new project instantly with the **"Use this template"** button at the top of the page.

---

## Why this template

Most starters either just split folders, or go the other way and assume microservices (heavy). This one aims for the middle ground.

- **DDD that fits a monolith** — draw boundaries with 4 layers per domain, without splitting into services.
- **Rules enforced by the build, not docs** — `eslint-plugin-boundaries` blocks layer/domain violations, so the structure holds up over time.
- **Read/write separation (CQRS)** — writes go through aggregates (rules), reads are shaped for the screen. They never mix.
- **Cross-cutting concerns, ready to go** — envelope responses, global exception filter, auth guard, Swagger, security, logging, and CI are already wired.
- **Working sample + rule docs** — one `article` domain demonstrates the pattern, and `.claude/` holds the design baseline.

## Who it's for

- Teams/individuals with no scale or reason for microservices, but who **want to keep domain boundaries**
- People starting **DDD (Rich Domain) + CQRS** as a real structure on NestJS
- Anyone who wants **enforced boundaries + documented rules**, not just a "folder convention"

## Stack

- NestJS 11 · TypeScript (strict) · TypeORM 0.3 (MySQL)
- Validation class-validator · Logging nestjs-pino · Docs @nestjs/swagger
- Transactions `@Transactional()` (typeorm-transactional) · Testing Jest

## What's inside

- **Envelope response** `{ code, message, result }` (global interceptor + exception filter)
- **Domain exception → HTTP auto-conversion** (BaseException + global filter)
- **Global auth guard** (JwtAuthGuard + `@Public()` + `@CurrentUser()`) — token verification only; login/issuance is left to your project
- **Swagger** envelope generic wrappers (`ApiResult`/`ApiResultList`) + auto-documented domain exceptions (`ApiErrors`)
- **Security** helmet + CORS (WEB_ORIGIN only) + rate limit
- **Architecture boundary lint** (eslint-plugin-boundaries) — build fails on layer/domain violations
- **CI** (lint + test + build)

## Architecture at a glance

Dependencies always point **toward the domain** (the domain stays pure). Only infrastructure inverts the dependency to implement the domain.

```
Interface   →   Application   →    Domain    ←   Infrastructure
(controller)   (command/query)  (aggregates·ports)  (repository·query impl)
```

One domain = one set of 4 layers:

```
<domain>/
  interface/       HTTP entry (controller, DTO)
  application/     use-case wiring (command/query service, ports, DTO)
  domain/          pure rules (aggregates, repository ports)
  infrastructure/  outside world (repository·query·entity·mappers)
```

- **Write**: controller → command service → aggregate (rules) → repository → DB
- **Read**: controller → query service → query port → DB (skips the aggregate, straight to DTO)

## Getting started

```bash
pnpm install
cp .env.example .env      # fill in values (DATABASE_URL, etc.)
pnpm start:dev
# API docs: http://localhost:4000/docs
```

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm lint` / `pnpm test` / `pnpm build` | Same as CI |
| `pnpm migration:run` / `pnpm migration:revert` | TypeORM migrations |

## Project structure

```
src/
  common/     envelope·filter·guard·Swagger wrappers·validation·logging·security (shared)
  config/     env validation (fail-fast)
  database/   TypeORM DataSource + migrations
  <domain>/   4 layers per domain (interface / application / domain / infrastructure)
```

## Adding a new domain

Copy the sample domain (`src/article`), rename it, fill in the rules, then register the module in `app-module.ts`. Once you've internalized the pattern, delete `article`.

## Documentation

The full architecture/convention baseline lives in [`CLAUDE.md`](./CLAUDE.md) (the index) and the `.claude/` folder. These detailed docs are currently written in Korean.

- **Architecture** `.claude/architecture/` — design principles·layers·modules·DDD·CQRS·repository·errors·ID·pagination
- **Conventions** `.claude/conventions/` — naming·code style·Nest·testing·enforcement·Git
- **Foundation** `.claude/foundation/` — overview·API contract·auth·logging/security·config·Swagger·CI

## License

[MIT](./LICENSE) © Seio924
