> 🌐 [한국어](./naming.md) · **English**

# Naming

File names use **kebab-case + a hyphenated role suffix**. For per-file placement details, see [directory-structure](../architecture/directory-structure.en.md).

## Files

kebab-case + **hyphenated** role suffix.

```
article-module.ts
article-controller.ts
article-command-service.ts            # command / query service
article-repository.ts                 # port (domain)
article-repository-impl.ts            # implementation (infra)
create-article-request-body.ts        # DTO (request/response body·param·query)
article-exceptions.ts                 # multiple classes in 'one file' per domain
article-error-code.ts / article-error-message.ts   # code·message constants
article-command-service.spec.ts       # tests keep .spec.ts
```

**Exception rule — Nest framework primitives keep the dot suffix**: `.guard.ts` · `.filter.ts` · `.interceptor.ts` · `.pipe.ts` · `.decorator.ts` · `.spec.ts` · `.entity.ts`. This is because linters/CLIs/community tools glob for these patterns (e.g., `jwt-auth.guard.ts`, `all-exceptions.filter.ts`, `article.entity.ts`). **All other domain/application/infrastructure role files are fully hyphenated.**

## Classes

PascalCase + role suffix. `ArticleCommandService`, `CreateArticleRequestBody`, `ArticleNotFoundException`

## Everything else

| Target | Rule | Example |
|---|---|---|
| Folder | kebab-case | `article/` |
| Variables · functions | camelCase | `authorId` |
| Constants | UPPER_SNAKE_CASE | `MAX_TITLE_LENGTH` |
| Types · interfaces | PascalCase | `ArticleListItem` |

## Method names

- Start with a verb.
- Boolean-returning methods start with `is` / `has` / `can`.

### Lookup method names (per layer)

Two things determine a lookup name: **null vs. exception when absent**, and **which layer**.

| Layer | Single | List |
|---|---|---|
| **Repository** (aggregate, infra) | `findById` · `findBy<Field>` — **null** when absent | `find<Nouns>(criteria)` |
| **Command service** (helper loading its own aggregate) | `get<Entity>` — **exception** when absent | (usually delegates to repo `find<Nouns>`) |
| **Query** (DTO reads, CQRS) | `get<View>` — returns a DTO (may be null) | `get<Nouns>` · `search<Nouns>` |

- **A repository with multiple keys** exposes the key via `By<Field>`: `findById` · `findBySlug`.
- **A command service helper that loads one of its own aggregates and throws when absent** is named `get<Entity>`: `getArticle`. (Not `getById` — put the target in the name so the call site is self-evident.)
- **Lists have no null/exception distinction** — zero results is normal (an empty array). For a repo, `find<Nouns>`; for a query, `get<Nouns>`/`search<Nouns>`.

```ts
findById(id: string): Promise<Article | null>                    // repository single (null when absent)
findArticles(criteria: FindArticlesCriteria): Promise<Article[]> // repository list
private getArticle(id: string): Promise<Article>                 // command load + throw when absent
searchArticles(q: SearchArticlesQuery): Promise<SearchArticlesResult> // query read (DTO)
canEdit(article: Article): boolean                               // boolean = is/has/can
publish(id: string): Promise<void>
```
