> 🌐 [한국어](./module-pattern.md) · **English**

# Module Pattern (NestJS wiring)

> The place where ports/adapters/layers are **actually connected (wired)**. For concepts see [design-principles.md](./design-principles.en.md); for direction see [layer-architecture.md](./layer-architecture.en.md).

---

## 1. 1 Domain = 1 NestJS Module

- **1 Bounded Context = 1 Module.** Modules are divided by **domain**, not by technical layer.
- One module contains all 4 layers (domain/application/interface/infrastructure).
- Minimize direct dependencies between modules; cross only via `imports`/`exports` + adapter.
- Shared infrastructure (TypeORM, AuthGuard, etc.) goes in a separate module.

```
src/
  article/     ← ArticleModule (4 layers + article-module.ts)
  common/      ← shared utilities
  database/    ← DatabaseModule
  app-module.ts ← root module
```

> Below, `point`·`stat` are example neighbor domains used to illustrate cross-domain wiring (not present in the sample).

---

## 2. Module = Wiring Board (full example)

```ts
// article/article-module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity]),   // register this domain's TypeORM entity
    // PointModule, StatModule,                   // if there is cross-domain, import the other module
  ],
  controllers: [ArticleController],
  providers: [
    ArticleCommandService,                        // ordinary classes are just listed
    ArticleQueryService,
    // port → impl wiring
    { provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl },
    { provide: ARTICLE_QUERY,      useClass: ArticleQueryImpl },
    // { provide: POINT_ADAPTER,   useClass: PointAdapterImpl },
  ],
  exports: [ArticleCommandService, ArticleQueryService],  // only what to expose to others
})
export class ArticleModule {}
```

---

## 3. `{ provide: port, useClass: impl }` — plugging an impl into a port

```ts
{ provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl }
```
How to read it: **"When the `ARTICLE_REPOSITORY` token is requested, plug in `ArticleRepositoryImpl`."**

Injection side:
```ts
constructor(
  @Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
) {}
```
→ This is how "knowing only the port, not the impl" (dependency inversion) is realized.

> ⚠️ Ports are defined with interface + InjectionToken, so injection requires `@Inject(TOKEN)`.

---

## 4. `exports` — the Domain's Public API (🔴 core)

```ts
exports: [ArticleCommandService, ArticleQueryService],  // ✅ services only
// repository, query, adapter, entity, infra impl → ❌ never export
```

- Other domains can only inject **what is in exports.**
- If repository is not exported → other domains are **rejected at the DI level from even injecting it.**
- That is, "no direct access to someone else's repository" is not a documentation rule but **physically enforced.**

---

## 5. The 4 Steps of Cross-Domain Wiring (article uses point)

```ts
// 1) define the port — article/application/adapter/point-adapter.ts
export interface PointAdapter { grant(userId: string): Promise<void>; }
export const POINT_ADAPTER = 'PointAdapter';

// 2) impl — article/infrastructure/adapter/point-adapter-impl.ts  (import point only here)
@Injectable()
export class PointAdapterImpl implements PointAdapter {
  constructor(private readonly pointService: PointCommandService) {}  // what point exported
  async grant(userId: string) { return this.pointService.grant(userId); }
}

// 3) inject the port in the use case — article/application/command/...
constructor(@Inject(POINT_ADAPTER) private readonly pointAdapter: PointAdapter) {}

// 4) wire in the module — article-module.ts
imports: [PointModule],                                     // so point's exports can be used
providers: [{ provide: POINT_ADAPTER, useClass: PointAdapterImpl }]
```

**The chain:** `imports: [PointModule]` → article can use `PointCommandService` that point exported → `PointAdapterImpl` wraps it.
**The only place article imports point is `point-adapter-impl.ts`** (references to someone else's domain live only at the edge of infra → no cycle in the domain body).

---

## 6. Cycles = forwardRef Forbidden, Resolved by Design

> When an A→B→A cycle appears, don't work around it with `forwardRef()`. Redesign the domain boundary or switch to an event-based approach.

- `forwardRef()` is a band-aid that forcibly makes the cycle work → **forbidden.**
- A cycle is a signal that "the boundary was drawn wrong" → reassign responsibility (design-principles §5).

---

## 7. Root Module

```ts
// app-module.ts
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ArticleModule,
    // add domain modules here
  ],
})
export class AppModule {}
```

---

## 8. Controller Pattern

```ts
@Controller('articles')
@ApiTags('Article')
export class ArticleController {
  constructor(
    private readonly articleCommandService: ArticleCommandService,
    private readonly articleQueryService: ArticleQueryService,
  ) {}

  @Post()
  @CreateArticleDocs()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateArticleRequestBody,
  ): Promise<CreateArticleResponseBody> {
    const id = await this.articleCommandService.create({ authorId: user.userId, ...body });
    return { id };
  }
}
```

- The controller injects only command/query services (complete use cases). **It does not inject adapter·repository.**
- Authentication uses the global `JwtAuthGuard` + `@Public()` approach. By default everything is blocked and only public endpoints are opened with `@Public()`. (safe default)
- Swagger decorators go on every endpoint (bundled into a docs decorator and separated into `interface/`).

---

## 9. One-Line Summary

> A module is a wiring board. With `{ provide: port, useClass: impl }` you plug an impl into a port, put only services in `exports` to block repository exposure at the DI level, and connect cross-domain via `imports: [the other module]` + adapter. Cycles are solved by design, not forwardRef.
