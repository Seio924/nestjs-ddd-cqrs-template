> 🌐 [한국어](./cqrs-pattern.md) · **English**

# CQRS Pattern (Read/Write Separation)

> How command (write) and query (read) are split. For repository/query location, see [layer-architecture.md](./layer-architecture.en.md); for transactions, see [repository-pattern.md](./repository-pattern.en.md).

---

## 1. Core Idea — Split the Repository in Two

The usual approach puts both reads and writes in one repository (fine for simple CRUD). CQRS **splits this into two things of different character**.

```
Usual:     ArticleRepository (both read + write, returns entities)
                 ↓ split it
CQRS:  ArticleRepository (write only)  +  ArticleQuery (read only)
```

| | Repository (for writes) | Query (for reads) |
|---|---|---|
| Methods | `save`, `delete`, (fetch for write purposes) | `getArticle`, `listArticles` |
| Returns | **domain aggregate** (`Article`) | **screen-shaped DTO** (`GetArticleResult`) |
| Goes through domain | ✅ aggregate restoration (mapper) | ❌ **skips the domain** (DB directly) |
| Purpose | apply rules then save | fetch fast |
| Port/impl | domain / infra | application / infra |

> **Decisive rule:** the QueryService **never uses the Repository.** The Repository is a **write-only** channel that restores aggregates. Reads use a separate Query channel.

---

## 2. What "Reads Skip the Domain" Means

Reads **don't skip the DB.** Reads query the DB too. But in the **Query file, not the Repository file**, and **without restoring aggregates**, fetching in the shape of the screen.

**Why not go through aggregates:**
- Aggregates are needed **only for writes (rules·invariants).**
- Restoring a list (title+author+status) as aggregates → wasted mapping + N+1 + complexity.
- Query pulls only the needed fields and **goes straight to a DTO** → fast and simple.

```ts
// infrastructure/query/article-query-impl.ts — DB directly, no aggregate created
async listArticles(query: ListArticlesQuery): Promise<ListArticlesResult> {
  const [rows, count] = await this.repo.createQueryBuilder('a')
    .select(['a.id', 'a.authorId', 'a.title', 'a.status', 'a.createdAt'])   // screen fields only
    .take(query.take).skip(query.page * query.take)
    .getManyAndCount();
  return { articles: rows.map(/* ... */), count };
}
```

---

## 3. Write Flow (Command)

```
Controller → CommandService → aggregate → Repository → DB
```

```ts
// application/command/article-command-service.ts
@Injectable()
export class ArticleCommandService {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository) {}

  @Transactional()
  async publish(id: string): Promise<void> {
    const article = await this.articleRepo.findById(id);   // load aggregate
    if (!article) throw new ArticleNotFoundException();
    article.publish();                                     // apply domain rules
    await this.articleRepo.save(article);                  // save
  }
}
```

---

## 4. Read Flow (Query)

```
Controller → QueryService → Query port → QueryImpl (DB directly)
```

```ts
// application/query/article-query-service.ts
@Injectable()
export class ArticleQueryService {
  constructor(@Inject(ARTICLE_QUERY) private readonly articleQuery: ArticleQuery) {}

  async getArticle(id: string): Promise<GetArticleResult> {
    const article = await this.articleQuery.getArticle(id);   // delegate to Query (doesn't use Repository!)
    if (!article) throw new ArticleNotFoundException();
    return article;
  }
}

// application/query/article-query.ts — Query port
export interface ArticleQuery {
  getArticle(id: string): Promise<GetArticleResult | null>;
}
export const ARTICLE_QUERY = 'ArticleQuery';
```

---

## 5. Without CommandBus (service methods)

**We don't use `@nestjs/cqrs`'s CommandBus/QueryBus + @CommandHandler classes.** A Command object + `@CommandHandler` class per use case explodes the file count, and it's overkill at the current scale (design-principles §6). Instead, **make command/query services plain classes** and have the controller call them directly.

- The controller calls the service method directly, like `commandService.publish(id)` (not `commandBus.execute(cmd)`).
- The unit of a use case is a service method, not a Command object.
- **Keep the input DTO** (class-validator validation). We only skip "putting a Command object on a bus."

---

## 6. Keep vs Remove Summary

| CQRS element | Adopted? |
|---|---|
| command/query folder·service separation | ✅ |
| **Query doesn't use the Repository (separate read-only channel)** | ✅ (core) |
| Reads skip the domain, DB directly → DTO | ✅ |
| Input DTO + class-validator | ✅ |
| CommandBus/QueryBus, @CommandHandler, CqrsModule | ❌ (replaced by service methods) |

CommandBus is just the **shell (a delivery mechanism)**; the substance of CQRS (read/write separation + a separate Query channel) is kept intact.

---

## 7. One-Line Summary

> CQRS splits "one repository" into Repository (write, returns aggregates) and Query (read, returns DTOs). Reads skip the domain and fetch from the DB in the shape of the screen, so they're fast. We drop CommandBus and make command/query services classes that the controller calls directly.
