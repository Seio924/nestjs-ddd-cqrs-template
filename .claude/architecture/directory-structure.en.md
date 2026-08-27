> 🌐 [한국어](./directory-structure.md) · **English**

# Directory Structure

> Defines where files actually go. For concepts see [design-principles.md](./design-principles.en.md).
> The example domain is based on this template's sample domain `article`.

---

## 1. Top-level `src/` structure

```
src/
  common/                    # shared utilities (interceptor, filter, guard, decorator, etc.)
  database/                  # shared DB configuration (TypeORM DataSource, etc.)
  config/                    # per-environment / per-concern config
  <domain>/                  # domain module (4 layers repeated per context)
```

> ⚠️ Do not create `outbox/` or `task-queue/` (@Global shared module) folders.
> Reason: with a single DB, cross-domain writes are handled by synchronous transactions, so Outbox/SQS is unnecessary. (design-principles §4)

---

## 2. Domain module structure (4 layers)

Using the `article` domain as an example (with comments on what each file is). Some parts (adapter/·event/·service/·scheduler/·value objects·domain events) are optional elements kept **only when needed** — the sample uses just a subset of them.

```
article/
  domain/                              # pure rules (knows no DB·framework)
    article.ts                         # aggregate root (entity, holds rules)
    article-title.ts                   # value object (Value Object)
    article-published.ts               # domain event (optional)
    article-repository.ts              # repository port (interface)

  application/                         # use case wiring
    command/
      article-command-service.ts       # write use cases (orchestration goes here too)
      dto/                             # command input/output data types (separate from the service)
        <verb>-<noun>-command.ts       # command object (input)
    query/
      article-query-service.ts         # read (bypassing the entity)
      article-query.ts                 # query port (interface) — a port is not a DTO, not placed under dto/
      dto/                             # query input/output data types
        <verb>-<noun>-query.ts         # query object (input)
        <verb>-<noun>-result.ts        # query result DTO (output)
    adapter/                           # port (door) to someone else's domain — only when there is cross-domain
      <external>-adapter.ts
    service/                           # technical service port — when needed
      <concern>-service.ts
    event/                             # event handlers (side effects) — when needed
      article-published-handler.ts

  interface/                           # HTTP entry point
    article-controller.ts              # controller
    article-controller-docs.ts         # Swagger decorators (next to the controller; if several, docs/)
    dto/
      create-article-request-body.ts   # request body
      <verb>-<noun>-request-param.ts
      <verb>-<noun>-request-query.ts
      <verb>-<noun>-response-body.ts   # response body

  infrastructure/                      # the outside world (external libraries go only here!)
    entity/
      article.entity.ts                # TypeORM entity (DB table mapping)
    repository/
      article-repository-impl.ts       # repository port impl + mapper
    query/
      article-query-impl.ts            # query port impl
    adapter/                           # impl of the other-domain adapter — when needed
      <external>-adapter-impl.ts
    service/                           # technical service impl — when needed
      <concern>-service-impl.ts
    scheduler/                         # cron/scheduler — when needed
      <concern>-scheduler.ts

  article-module.ts                    # NestJS module (DI wiring)
  article-error-message.ts             # collection of error messages
  article-error-code.ts                # collection of error codes (<DOMAIN>_<REASON>)
  article-enum.ts                      # collection of enums
  article-constant.ts                  # collection of constants (when needed)
```

---

## 3. Placement Rules (🔴 core)

| Kind | Port/definition location | Implementation location |
|---|---|---|
| **Repository** | `domain/<aggregate>-repository.ts` | `infrastructure/repository/<aggregate>-repository-impl.ts` |
| **Query** | `application/query/<domain>-query.ts` | `infrastructure/query/<domain>-query-impl.ts` |
| **Adapter** (someone else's domain) | `application/adapter/<external>-adapter.ts` | `infrastructure/adapter/<external>-adapter-impl.ts` |
| **Technical service** | `application/service/<concern>-service.ts` | `infrastructure/service/<concern>-service-impl.ts` |

**Common principles:**
- **Ports (contracts) go in domain/application, implementations always in infra.**
- **infra, like application, is split into per-role subfolders** (repository/·query/·adapter/·service/). infra is the busiest layer where implementations gather, so per-role folders are needed, and it mirrors application (command/·query/·adapter/) symmetrically.
- **TypeORM entities go in `infrastructure/entity/`.** (A separate file from the domain entity `article.ts` — the mapper converts between them)
- **Any file that imports an external library (TypeORM·axios·SDK) always goes in infra.**

### application DTO placement·naming

Do not mix the command/query **services** with their **input/output data types**. Data types are separated into a **`dto/` subfolder** on each side (the same pattern as interface/dto/, keeping the CQRS separation).

- `application/command/dto/` — command input (command object)·output data types
- `application/query/dto/` — query input (query object)·output (result) data types
- **A port is not a DTO** — `query.ts` (query port)·`adapter.ts` (adapter port)·`service.ts` (technical service port) are not placed under dto/ but kept in their own spot.

**Naming rule** — the criterion that separates the filenames is not "command/query" but **"is it a shared value / dedicated to a specific use case":**

| Kind | Naming | Example |
|---|---|---|
| Input (write) | `<verb>-<noun>-command.ts` | `publish-article-command.ts` |
| Input (read) | `<verb>-<noun>-query.ts` | `search-articles-query.ts` |
| Specific-use-case output | `<verb>-<noun>-result.ts` | `get-article-detail-result.ts` |
| Value shared by multiple use cases | descriptive name | `article-summary.ts` |

> `article-summary` is not `-result` because it is not the "result" of one use case but a value **shared** by multiple queries.

---

## 4. The Two Kinds of "Entity" (watch out for confusion)

| | `domain/article.ts` | `infrastructure/entity/article.entity.ts` |
|---|---|---|
| Identity | **domain entity** (pure rules, `article.publish()`) | **TypeORM entity** (DB table, `@Entity`·`@Column`) |
| Depends on | nothing (pure TS) | TypeORM |
| Conversion | ← the **mapper** in `article-repository-impl.ts` converts between the two → | |

This mapper is the cost (tax) of "keeping the domain pure even while using TypeORM."

---

## 5. enum/constant/error File Rules

- **No inlining.** enums·constants are collected into separate files and placed at the **domain root**.
  - `article-enum.ts` — all enums of this domain
  - `article-constant.ts` — all constants of this domain (`UPPER_SNAKE_CASE`)
  - `article-error-message.ts` / `article-error-code.ts` — error messages/codes (1:1)

---

## 6. Shared Module Rules

- Extract to the top level (`common/`, etc.) **only when another domain actually shares it.**
- Don't prematurely pull things out into a shared folder. If only one domain uses it, keep it inside that domain.

---

## 7. File Naming

- **kebab-case + role suffix.** The `-module.ts` form, not `.module.ts`.
  - `article-module.ts`, `article-controller.ts`, `article-command-service.ts`, `article-repository-impl.ts`
- Only Nest primitives (`.guard.ts`·`.filter.ts`·`.interceptor.ts`·`.pipe.ts`·`.decorator.ts`·`.spec.ts`·`.entity.ts`) keep the dot (.) suffix. For details see [conventions/naming](../conventions/naming.en.md).
