> 🌐 [한국어](./error-handling.md) · **English**

# Error Handling

> How an error flows from the domain to the HTTP response. For the response format, see [design-principles.md](./design-principles.en.md) §8.
> Approach: domain exception classes + global filter. Because a domain exception carries its own code/status/message, the controller doesn't need to repeat mapping code — the global filter handles it automatically.

---

## 1. Error Flow

```
① domain/service   throw domain exception class (extends BaseException)
      ↓
② command service  passes through without catching
      ↓
③ controller       doesn't catch (no catch)
      ↓
④ global exception filter    reads the exception's code/status/message and converts it into the response format
```

Core: **the exception carries its own code/status/message, so the controller does nothing and the global filter handles it automatically**.

---

## 2. Domain Exception Class (BaseException)

```ts
// common/exceptions/base-exception.ts
export abstract class BaseException extends Error {
  abstract readonly code: string;    // error code (<DOMAIN>_<REASON>)
  abstract readonly status: number;  // HTTP status
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
```

**Errors are gathered into 3 files per domain** (prevents file explosion + forbids magic strings):

```
article/
  article-error-code.ts      # code constants (SCREAMING_SNAKE)
  article-error-message.ts   # message strings
  article-exceptions.ts      # exception classes (one file, many) — reference the constants above
```

```ts
// article-error-code.ts
export const ArticleErrorCode = {
  NOT_FOUND: 'ARTICLE_NOT_FOUND',
  ALREADY_PUBLISHED: 'ARTICLE_ALREADY_PUBLISHED',
} as const;

// article-exceptions.ts   ← multiple exception classes in one file per domain
export class ArticleNotFoundException extends BaseException {
  readonly code = ArticleErrorCode.NOT_FOUND;      // no magic string (references constant)
  readonly status = 404;
  constructor() { super(ArticleErrorMessage.NOT_FOUND); }
}
export class ArticleAlreadyPublishedException extends BaseException {
  readonly code = ArticleErrorCode.ALREADY_PUBLISHED;
  readonly status = 409;
  constructor() { super(ArticleErrorMessage.ALREADY_PUBLISHED); }
}
// ... this domain's exceptions in a row
```

- **Don't create one file per error.** Gather exception classes into a single `<domain>-exceptions.ts` per domain.
- Keep codes/messages as constants in `<domain>-error-code.ts`·`<domain>-error-message.ts` (no magic strings).
- Error code: `<DOMAIN>_<REASON>` SCREAMING_SNAKE_CASE, globally unique.

---

## 3. Throwing from Domain/Service

```ts
// domain/article.ts — on rule violation
if (this._status !== ArticleStatus.DRAFT) throw new ArticleAlreadyPublishedException();

// application/command/article-command-service.ts — wiring guard
const article = await this.articleRepo.findById(id);
if (!article) throw new ArticleNotFoundException();
```

- Domain and application throw **only domain exception classes**. Plain `Error`·`HttpException` forbidden.
- Domain exceptions **(mostly) don't know HTTP.** `status` is held only at a "severity" level (a pragmatic compromise).

---

## 4. Controller — Does Nothing

```ts
@Get(':id')
async get(@Param('id') id: string): Promise<ArticleResponseBody> {
  return ArticleResponseBody.of(await this.articleQueryService.getArticle(id)); // if it throws, just passes through
}
```

- No `.catch()`. The exception flows to the global filter. Since the domain exception already carries code/status/message, there's nothing to map in the controller.

---

## 5. Global Exception Filter + Response Format

The response format follows the envelope `{ code, message, result }`.

```ts
// common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 1) domain exception → code/status/message as-is
    if (exception instanceof BaseException) {
      return res.status(exception.status).json({
        code: exception.code, message: exception.message, result: null,
      });
    }
    // 2) validation failure → VALIDATION_FAILED + field/rule codes
    if (exception instanceof ValidationException) {
      return res.status(400).json({
        code: 'VALIDATION_FAILED', message: '입력값이 올바르지 않습니다',
        result: exception.fieldErrors, // [{ field: 'title', rules: ['isString'] }]
      });
    }
    // 3) other framework HttpException (no route 404, etc.) → keep status code
    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        code: 'COMMON_HTTP_ERROR', message: exception.message, result: null,
      });
    }
    // 4) other unhandled → INTERNAL_ERROR (prevent stack exposure)
    return res.status(500).json({
      code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다', result: null,
    });
  }
}
```

| Response case | code | status |
|---|---|---|
| Domain exception | the exception's `code` | the exception's `status` |
| Validation failure | `VALIDATION_FAILED` (+ `[{ field, rules }]` in result) | 400 |
| Other framework HttpException (no route 404, etc.) | `COMMON_HTTP_ERROR` | keeps the exception's status |
| Unhandled exception | `INTERNAL_ERROR` (original logged, message generalized) | 500 |

Failure response example:
```jsonc
{ "code": "ARTICLE_NOT_FOUND", "message": "게시글을 찾을 수 없습니다", "result": null }
```

---

## 6. One-Line Summary

> A domain exception class carries code/status/message and is thrown → command·controller pass it through → the global filter converts it into `{ code, message, result }` automatically. Exceptions are gathered into a single file per domain (`<domain>-exceptions.ts`) to prevent file explosion. Don't throw plain Error·HttpException from domain/service.
