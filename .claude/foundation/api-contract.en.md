> 🌐 [한국어](./api-contract.md) · **English**

# API Contract (Response · Error · Validation)

> Reference: the detailed response/error principles live in [`../architecture/design-principles.en.md`](../architecture/design-principles.en.md) §8 + [`../architecture/error-handling.en.md`](../architecture/error-handling.en.md).

## Response format — `{ code, message, result }` envelope

The global `ResponseInterceptor` wraps successful responses in the envelope. **Controllers return raw data (DTO) only.**

```jsonc
// success
{ "code": "SUCCESS", "message": "요청 성공", "result": { ... } }
// failure (same shell as success, result=null)
{ "code": "ARTICLE_NOT_FOUND", "message": "...", "result": null }
```

- Use HTTP status codes honestly (200/201/204/4xx/5xx). The frontend branches on `code` (never depend on the message text).
- **Pagination**: inside `result`, use a **domain plural key** (`result: { articles: [...], count }` or `{ ..., nextCursor, hasNext }`). Generic keys (`data`/`items`) are forbidden. Details in [`../architecture/pagination.en.md`](../architecture/pagination.en.md).
- Bodyless cases like `204 No Content` are not wrapped.

## Error handling

**Flow**: a domain exception class (extending `BaseException`) is thrown → it passes through command·controller → the global `AllExceptionsFilter` converts it into the envelope. Details and examples in [`error-handling.en.md`](../architecture/error-handling.en.md).

| Exception kind | status | code | result |
|---|---|---|---|
| `BaseException` (domain exception) | exception's `status` | exception's `code` | `null` |
| Validation failure (ValidationPipe) | 400 | `VALIDATION_FAILED` | `[{ field, rules }]` |
| Other framework HttpException (unknown route 404, etc.) | keeps the exception's status | `COMMON_HTTP_ERROR` | `null` |
| Other unhandled | 500 | `INTERNAL_ERROR` (log the original, generalize the message) | `null` |

**Error code scheme**: `<DOMAIN>_<REASON>` `UPPER_SNAKE_CASE` (e.g., `ARTICLE_NOT_FOUND`).
- Code/message constants live per domain in `<domain>-error-code.ts`·`<domain>-error-message.ts`, and the exception classes are collected in a single `<domain>-exceptions.ts` file.

## Validation

- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Request body/query/params are accepted **only via DTO classes + class-validator**.
- DTO location: `<domain>/interface/dto/`, with filenames like `-request-body.ts`/`-response-body.ts`.
