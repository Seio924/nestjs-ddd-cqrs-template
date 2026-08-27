> 🌐 [한국어](./design-principles.md) · **English**

# Design Principles (Rich Domain 4-Layer)

> This document is the **core architecture principles** of this template.
> Premise: **single app + single DB**. This premise is the basis for several decisions (e.g., not adopting Outbox/SQS). If it is split into multiple apps or distributed transactions become necessary, revisit at that point.

---

## 1. Stack & Big Picture

- **NestJS + TypeORM + TypeScript**
- **Rich Domain 4-Layer** (4 layers per context)

```
src/<domain>/
  interface/        HTTP entry point (controller)
  application/      use case wiring (command/query service, adapter port)
  domain/           pure rules (entity, domain service, repository port)
  infrastructure/   outside-world implementation (repository impl, mapper, adapter impl, external integration)
```

---

## 2. The Roles of the 4 Layers (🔴 core)

| Piece | What it does | Touches DB? | Layer |
|---|---|---|---|
| **entity** (`Article`) | **rules** (`if`·calculation·invariant). State is private, changed only via rule methods | ❌ | domain |
| **domain service** | **"ownerless" rules spanning multiple entities** (transfer/exchange kind). Exists **only occasionally** | ❌ | domain |
| **command service** | use case **wiring** (loading·saving·ordering·transaction) | ✅ | application |
| **query service** | **read**-only queries (bypassing the entity, shaped for the screen) | ✅(read) | application |
| **controller** | receives HTTP and converts the response. No logic | — | interface |
| **repository impl** | actual DB queries + entity↔DB mapper | ✅ | infra |

### How to tell (when the layer is confusing)
- If there is an `if`·calculation·domain rule → entity (domain). Don't put domain rules (`if`) in command.
  - Exception: a **wiring guard** like "loaded it and it's not there, so throw" is OK in command. (Judging data presence ≠ a domain rule)
- **If it touches repository·DB → command service (application).**
- **A file that imports an external library (TypeORM, axios, S3 SDK, etc.) → always infra.**

### Why divide it this way — resolving service bloat
The traditional (anemic) approach lumps rules + wiring into one service, so the service bloats.
Rich domain **pushes rules down into the entity**, keeping the service thin.
- rule (`if published, cannot edit`) → entity (`article.edit()`)
- wiring (load·save) → command service

### command → calling the entity directly is the default
`command → domain service → entity` is **not always the case.** Most of the time it's `command → entity` directly.
The domain service only steps in for **ownerless rules spanning multiple entities**.
- Owner is clear → that entity's method (e.g., `article.publish()`)
- Ownerless neutral rule → domain service (e.g., `remit(from, to)`, `swap(itemA, itemB)`)

---

## 3. Ports & Adapters

- **Port = interface (a contract), adapter = implementation.** The port states only "what can be done"; the adapter implements "how."
- **Ports are defined with `interface` + `InjectionToken`** (the industry-standard way).
  - `interface` disappears at runtime, so NestJS DI can't find it; hence we wire it with a string token (`InjectionToken`) and inject via `@Inject(TOKEN)`.
  - Wiring: `providers: [{ provide: TOKEN, useClass: XxxImpl }]`
- **repository ports** go in domain, **implementations (`...Impl`) go in infra**.
- The purpose of an adapter is **not "removing" a dependency but "isolating" it**:
  1. a **channel** for cross-domain calls
  2. **isolating the shock of someone else's change into one file (the adapter impl)** → maintainability
  3. depending on an abstraction → **being able to choose the dependency direction** (DIP)

---

## 4. Cross-Domain (🔴 the most-discussed topic)

### Basic rule
```
my domain     → directly (read with query, write with command)
someone else's domain → always through the adapter door (both read and write)
```
The criterion is not "read/write" but **"my domain / someone else's domain."**
For someone else's domain, you only call what that domain `exports` (a read Query, etc.) through the adapter. You never touch their repository·internals (ACL, anti-corruption layer).

### Owner domain = first URL segment
- `POST /articles` → the owner is **article**.
- **Orchestration** that coordinates multiple domains happens **inside the owner domain's command service.** (No separate higher layer is created)
- **"Orchestration" is not a separate device.** A command service that knocks on several other-domain adapters is itself the orchestration.

```ts
// article/application/command/publish-article-command-service.ts
async publishArticle(articleId: string) {
  await this.txManager.run(async () => {           // one transaction = atomicity
    const article = await this.articleRepo.findById(articleId);  // my domain (directly)
    article.publish();
    await this.articleRepo.save(article);
    await this.pointAdapter.grant(article.authorId);  // someone else's domain (adapter)
    await this.statAdapter.increment(article.authorId); // someone else's domain (adapter)
  });
}
```
> `point`·`stat` are example neighbor domains used to illustrate cross-domain (not present in the sample code).

### Cross-domain writes: synchronous transaction
- Cross-domain writes are handled by **a single synchronous transaction.** Bundling atomic writes into one transaction gives you **real atomicity.**
- **Outbox/SQS not adopted.** Reason: with a single DB, atomicity can be secured with a synchronous transaction, without asynchronous eventual consistency. (Promote it later when splitting into microservices)

### Side effects: events
- Things like notifications·push·statistics that **don't need atomicity + don't roll back the core flow when they fail** go through **events**.
- Start with Nest **EventEmitter**. (Consider Outbox when preventing loss becomes important)

### Isolation·cycle·atomicity are different problems (don't confuse them)
| Problem | What? | Solution |
|---|---|---|
| **isolation** | "when someone else changes, I shake" | **adapter** (maintainability·hiding internals·choosing direction) |
| **cycle** | "A↔B mutually entangled" | **design** (below) — the adapter is not what blocks it |
| **atomicity** | "all or nothing" | **synchronous transaction** (instead of Outbox/SQS) |

Our choice (adapter, synchronous) **keeps code isolation** and **only gives up time isolation (asynchrony).** Since it's a single app, time isolation is unnecessary and atomicity matters more, so this is the right answer.

---

## 5. Preventing Cycles (blocked by design)

- **The domain layer (entities) knows nothing about other domains = "leaf".** References, if any, exist only at the very edge of the infra adapter impl.
- **Adapters don't automatically block cycles.** If A calls B and B calls A, each through an adapter, it's still a cycle.
- Cycles are blocked **by design**:
  1. **One owner per use case + references in one direction only.**
  2. When a cycle appears, **first suspect "isn't the responsibility misplaced"** and move it. (This resolves most of them)
  3. If truly bidirectional, **break one side with an event.** (Last resort, not `forwardRef`)

---

## 6. CQRS

- **Folder separation (command/query) is adopted (yes).** **CommandBus (a Command+Handler class per use case + a bus) is on hold.**
  - Keep them as methods in the command service (the lightweight version). If needed, introduce CommandBus later for specific domains only.
- **Why CQRS:** rich domain (entities·invariants) is needed **only for writes.** Reads (list·report queries), if routed through entities, cause N+1·waste → **query ignores the entity and writes an optimized query shaped for the screen.**

```
application/
  command/   write (through the entity, rules·transaction)
  query/     read (bypassing the entity, optimized query)
  adapter/   port to someone else's domain
```

---

## 7. Error Handling

- The entity `throw`s a domain exception (not `return`). Because on a rule violation the flow must stop.
- Domain exceptions **know nothing about HTTP** (`ArticleNotEditableException` yes, Nest `BadRequestException` ✗).
- Flow: **entity throws → command doesn't catch, passes through → the global exception filter converts it to HTTP.**
- Something like "capping (if over 100, make it 100)" is not an exception but just handled by the rule (`Math.min`).

---

## 8. API Response Format

- Envelope style: `{ code, message, result }` (same shell for success and failure).
  ```jsonc
  // success (200)
  { "code": "SUCCESS", "message": "...", "result": { ... } }
  // failure (404)
  { "code": "ARTICLE_NOT_FOUND", "message": "...", "result": null }
  ```
- Error code format: `<DOMAIN>_<REASON>` UPPER_SNAKE (e.g., `ARTICLE_NOT_FOUND`).
- HTTP status codes are also given honestly (200/201/204/4xx/5xx). The frontend branches on `code` (no dependence on message text).
- Unwrapping the envelope·normalizing errors is absorbed in **one place, the frontend's http client**.

> The envelope is practical for a self-frontend-only API (consistent error branching, easy type generation). For a public REST API, consider pure REST.

---

## 9. Decision Summary (one page)

| Item | Decision |
|---|---|
| ORM | TypeORM |
| Architecture | Rich Domain 4-Layer (per context) |
| Port definition | interface + InjectionToken |
| CQRS | folder separation yes / CommandBus on hold |
| Cross-domain | someone else's domain = adapter (both read and write) |
| Cross-domain writes | synchronous transaction (Outbox/SQS not adopted) |
| Side effects | events (EventEmitter) |
| Cycles | blocked by design (one owner + one direction) |
| Errors | entity throws → global filter converts, domain exceptions know no HTTP |
| Response format | `{ code, message, result }` |
| repository queries | `findById` etc. allowed (not forcing a single find) |
