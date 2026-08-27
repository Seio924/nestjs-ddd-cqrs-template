> 🌐 [한국어](./layer-architecture.md) · **English**

# Layer Architecture (dependency direction)

> Defines "who can call whom." For file placement see [directory-structure.md](./directory-structure.en.md); for concepts see [design-principles.md](./design-principles.en.md).

---

## 1. Dependency Direction — the core picture

```
Interface  →  Application  →  Domain  ←  Infrastructure
(controller)  (command/query)  (entity·port)  (repository impl)
```

- **All arrows point toward Domain.** Domain **only receives arrows and never sends them** (= leaf, king).
- **Only Infrastructure has its arrow reversed** (pointing up) = **dependency inversion (DIP)**.

Arrow = "who imports whom." infra imports and implements the domain's port, so it's `infra → domain`.

---

## 2. Responsibilities of Each Layer

| Layer | Responsibility | What it does NOT do |
|---|---|---|
| **Interface** (controller) | receive requests, call application, convert responses | business logic, DB access, calling repository directly |
| **Application** (command/query service) | use case wiring (load·save·order·transaction), coordination | domain rules (`if`), HTTP concerns |
| **Domain** (entity, port) | pure rules (invariant·calculation), port definitions | dependence on framework·ORM·other layers |
| **Infrastructure** (implementation) | port impl, ORM access, external integration, mapper | business judgment |

---

## 3. Dependency Inversion (why only infra has a reversed arrow)

Common sense would say `Application → Infrastructure` (since the service uses the DB), but it's **the opposite**:

```
Application → Domain ← Infrastructure   (both point toward domain)
```

Reason: **the domain owns the port, and infra implements it.**

```ts
// domain/article-repository.ts  ← domain defines the "contract" (port)
export interface ArticleRepository {
  save(article: Article): Promise<void>;
}
export const ARTICLE_REPOSITORY = 'ArticleRepository';   // InjectionToken

// infrastructure/repository/article-repository-impl.ts  ← infra 'follows' the domain's contract
@Injectable()
export class ArticleRepositoryImpl implements ArticleRepository {  // ← imports domain!
  async save(article: Article): Promise<void> { /* TypeORM */ }
}

// wired in the module
{ provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl }
```

→ infra imports domain, so `infra → domain`. **domain knows nothing about infra.**
Result: even if you swap TypeORM, domain doesn't change; only infra re-implements to fit domain.

> ⚠️ Ports are defined with `interface` + `InjectionToken`. (see design-principles)

---

## 4. Port Location Rules (🔴 frequently confused)

Ports (interfaces) are **split** between domain and application, and this is not a scattering but placing each port precisely in **"the layer that owns (needs) that contract."**

| Port | Location | Ownership basis |
|---|---|---|
| **repository port** | **domain** | intrinsic need of the domain concept ("we need a means to save Article") |
| **adapter port** (someone else's domain) | **application** | a specific use case's circumstance ("this use case needs points") |
| **query port** | **application** | a use case's read need |

**Litmus test:**
- "Without this contract, does the **domain concept itself fail to hold**?" → domain (repository)
- "Is this contract needed **because of a specific use case**?" → application (adapter, query)

**Why it must be split this way (the necessity of the arrow rule):**
Putting the adapter port in domain → domain gets to know someone else's domain → purity (leaf) breaks. ❌
Putting the adapter port in application → domain doesn't know, only application knows the other → domain stays pure. ✅

**Common principle:** ports live in "the layer that feels the need," and **implementations (-impl) all go down to infra regardless of where the port is.**

---

## 5. Forbidden Combinations (all of them "going against the arrow")

| 🔴 Forbidden | What it violates |
|---|---|
| domain imports application/infrastructure/interface | domain must not send arrows (leaf breaks) |
| Nest decorators like `@Injectable`·`@Module` in domain | domain depending on the framework (the outside) |
| controller directly imports a repository impl | interface→infra shortcut forbidden, must go through application |
| public setter on an aggregate (`article.status = x`) | state changes only via rule methods (blocks bypassing the invariant) |
| domain rules (`if` conditions) in a command service | rules go in the entity (wiring guards are the exception) |

---

## 6. Cross-Domain Arrows

Cross-domain references use adapters. It's the same pattern as repository:

```
Application → Adapter port (application) ← AdapterImpl (infra) → someone else's domain exports
```

- adapter port = application, impl = infra.
- **The only place that imports someone else's domain is the very edge of the infra adapter impl** → which is why no cycle arises in the domain body itself (design-principles §5).

---

## 7. One-Line Summary

> All arrows point toward domain (domain = king, pure). Only infra implements domain via dependency inversion. Ports live in "the layer that needs them" (repository = domain, adapter/query = application), and all implementations go in infra. The forbidden rules are all "going against the arrow."
