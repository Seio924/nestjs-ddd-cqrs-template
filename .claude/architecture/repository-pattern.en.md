> 🌐 [한국어](./repository-pattern.md) · **English**

# Repository Pattern (Domain ↔ TypeORM)

> Where pure domain and the TypeORM DB are joined. Port/implementation/mapper/transaction.
> For port location, see [layer-architecture.md](./layer-architecture.en.md) §4; for aggregates, see [tactical-ddd.md](./tactical-ddd.en.md).

---

## 1. Port (domain) + Implementation (infra)

```ts
// domain/article-repository.ts — port (interface + InjectionToken)
export interface ArticleRepository {
  findById(id: string): Promise<Article | null>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
export const ARTICLE_REPOSITORY = 'ArticleRepository';
```

The implementation lives in infra, and TypeORM is imported only here.

---

## 2. Mapper — Pure Domain ↔ TypeORM (Core)

Inside the repository implementation, **two conversion functions** are the only bridge joining the two worlds.

```
save:  domain Article → toEntity → ArticleEntity(TypeORM) → DB
read:  DB → ArticleEntity(TypeORM) → toModel → domain Article
```

```ts
// infrastructure/repository/article-repository-impl.ts
@Injectable()
export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(
    @InjectRepository(ArticleEntity) private readonly repo: Repository<ArticleEntity>,
  ) {}

  async findById(id: string): Promise<Article | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async save(article: Article): Promise<void> {
    await this.repo.save(this.toEntity(article));
  }

  // mapper: domain → TypeORM entity
  private toEntity(a: Article): ArticleEntity {
    const e = new ArticleEntity();
    e.id = a.id;
    e.authorId = a.authorId;
    e.title = a.title;
    e.content = a.content;
    return e;
  }

  // mapper: TypeORM entity → domain
  private toModel(e: ArticleEntity): Article {
    return Article.restore({ id: e.id, authorId: e.authorId, title: e.title, content: e.content });
  }
}
```

- **The two kinds of entity are different classes:** the domain `Article` (pure rules) vs `ArticleEntity` (`@Entity`·`@Column`, TypeORM). The mapper converts between them.
- This mapper is the cost (tax) of "the domain stays pure even with TypeORM." **It exists only inside the repository implementation.**

---

## 3. Method Naming & No `update`

| Purpose | Pattern | Example |
|---|---|---|
| Single fetch | `findById` | `findById(id)` |
| List fetch | `find<Noun>s` | `findArticles(criteria)` |
| Save/upsert | `save` | `save(article)` |
| Delete | `delete` | `delete(id)` |

- ⚠️ `update` method forbidden (🔴). Don't put `updateArticle(id, {...})` in the repository.
  - Always use the **load → domain method → save** flow:
    ```ts
    const article = await this.articleRepo.findById(id);
    article.edit(dto.title, dto.content);   // passes through domain rules
    await this.articleRepo.save(article);
    ```
  - Reason: opening a repository update allows bypassing rules and modifying the DB directly.
- ✅ `findById` allowed. `findById(id)` in one line is clearer than forcing a single fetch through `findArticles({take:1}).pop()`.

---

## 4. Transactions — `@Transactional()` (Spring Style)

Adopt `@Transactional()` from the `typeorm-transactional` library. Same experience as Spring `@Transactional` — you don't pass tx as a parameter.

```ts
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ArticleCommandService {
  @Transactional()                              // ← this entire method is one transaction
  async publish(id: string): Promise<void> {
    const article = await this.articleRepo.findById(id);
    if (!article) throw new ArticleNotFoundException();
    article.publish();
    await this.articleRepo.save(article);          // automatically the same transaction
    // await this.pointAdapter.grant(article.authorId);  // a cross-domain call is the same transaction too (if any)
  }
}
```

**Principle:** Spring stores the current transaction in ThreadLocal → Node has none, so the same trick is done with `AsyncLocalStorage` (CLS). The repository automatically finds and joins the current transaction from CLS, so it **doesn't need to know about tx and the signature stays clean**.

Setup (once, in `main.ts`):
```ts
import { initializeTransactionalContext } from 'typeorm-transactional';
initializeTransactionalContext();   // before the app bootstraps
```

- This approach bundles atomic cross-domain writes into one transaction to give **true atomicity** (design-principles §4).
- ✅ **Self-invocation within the same class is also wrapped in a transaction.** Because typeorm-transactional replaces the prototype method in-place — it's not a separate proxy object, so, unlike Spring AOP, self-calls aren't bypassed. (verified against 0.5.0 source + runtime)
- ⚠️ In unit tests, a `@Transactional` method needs a real DB tx, so either neutralize the decorator with `jest.mock('typeorm-transactional')`, or verify it with an integration test that uses a test DB.

---

## 5. Soft Delete + Cascade

**Soft Delete** — record `deletedAt` instead of physical deletion. Automatically excluded from queries.
```ts
@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn() id: string;
  @DeleteDateColumn() deletedAt?: Date;
}
// repository
await this.repo.softDelete({ id });   // logical delete (fills deletedAt)
// queries automatically apply deletedAt IS NULL (include with withDeleted() if needed)
```
Deleted-data recovery and audit trails are possible.

**Cascade** — when saving/deleting an aggregate, child entities go along too.
```ts
async save(order: Order): Promise<void> {
  await this.repo.save(this.toEntity(order));                // root
  for (const item of order.items) await this.saveItem(item); // children (entities)
}
```
An aggregate is one chunk → the service calls `save(root)` only once, and the repository handles the children too.

---

## 6. Domain Event Publishing (Not Outbox)

**No Outbox.** With a single DB, there's no need to stage events into a separate Outbox table and deliver them with eventual consistency.
- After a successful save, publish via **Nest EventEmitter** (for side effects — notifications, etc.).
```ts
async save(article: Article): Promise<void> {
  await this.repo.save(this.toEntity(article));
  article.pullEvents().forEach(e => this.eventEmitter.emit(e.constructor.name, e));
}
```

---

## 7. Decision Summary

| Element | Decision |
|---|---|
| Mapper (toEntity/toModel) | ✅ adopted (inside the repository implementation) |
| No `update` method | ✅ adopted (load→domain method→save) |
| `findById` | ✅ allowed (single find not forced) |
| Transactions | `@Transactional()` (typeorm-transactional, Spring style) — no manager propagation |
| Soft Delete | ✅ adopted |
| Cascade save/delete | ✅ adopted |
| Outbox / event publishing | ❌ no Outbox → EventEmitter |

---

## 8. One-Line Summary

> The repository implementation converts pure domain ↔ TypeORM entity via a mapper (the only bridge). `update` is forbidden; modify only via load→domain method→save. Transactions use `@Transactional()` (Spring style, tx not passed) to get atomicity, use soft delete·cascade, and events are published via EventEmitter without Outbox.
