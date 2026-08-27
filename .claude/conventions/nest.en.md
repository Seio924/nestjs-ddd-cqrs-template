> 🌐 [한국어](./nest.md) · **English**

# Nest Usage Rules

## Dependency injection

- 🔴 **Use constructor injection only.** Property injection (`@Inject()` fields) is forbidden.
- 🔴 Providers must be registered in the module's `providers`.
- 🟡 Keep `exports` minimal. Export only what is needed externally.
- 🟡 When a single class injects **more than 4** dependencies, that's a sign of excessive responsibility. Consider splitting it.

```ts
// ✅ constructor injection
@Injectable()
export class ArticleCommandService {
  constructor(
    @Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
  ) {}
}
```

- 🔴 Declare injected dependencies as `private readonly`.

## Where to use each device

| Device | Purpose | Example |
|---|---|---|
| Pipe | Request data validation/transformation | DTO schema validation |
| Guard | Authentication/authorization | JWT verification, role check |
| Interceptor | Response format unification, logging | `{ code, message, result }` envelope wrapping |
| Exception Filter | Domain exception → HTTP response conversion | `ArticleNotFoundException` → 404 |
| Middleware | HTTP-level concerns | CORS, request logging |

- 🔴 A Service must not know about HTTP. Do not throw `HttpException` directly.
- 🔴 Throw domain exceptions via dedicated classes. No strings/generic Error.

```ts
// ❌ Service knows about HTTP
throw new HttpException('게시글을 찾을 수 없습니다', 404)
throw new Error('not found')

// ✅ throw a domain exception, and the filter converts it to HTTP
throw new ArticleNotFoundException()
```

## Response format (🔴 enforced)

- Every success response is wrapped by the global interceptor, and error responses are produced by the global exception filter. **The Controller returns pure data only.**
- The single source of truth for the concrete response/error shape and the error code system is [API Contract](../foundation/api-contract.en.md).
