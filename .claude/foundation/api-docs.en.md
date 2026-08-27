> 🌐 [한국어](./api-docs.md) · **English**

# API Documentation (Swagger)

Goal: **"Without reading the backend code, the frontend can be built just from Swagger."** Documentation is not optional — it's enforced.

## Basics

- Expose `/docs` via `@nestjs/swagger` (hidden in production).
- The spec is auto-generated from the DTO's class-validator + `@ApiProperty` → the source the frontend uses to generate types/clients (e.g., with orval). Swagger quality = frontend developer experience.

## Required elements per endpoint

① `@ApiTags` ② `@ApiOperation({ operationId, summary })` ③ `@ApiBody` (request type) ④ success response type (including the envelope) ⑤ per-error responses (status + error code) ⑥ per-field `@ApiProperty` on the DTO (example·constraints).

## Represent the envelope response precisely — the generic wrapper `ApiResult` (🔴 core)

The response is a `{ code, message, result }` envelope. Left as-is, Swagger emits `result` as `any`. A **generic wrapper + helper decorator** injects the real type into the `result` slot.

```ts
@ApiResult(ArticleResponseBody)                 // result: ArticleResponseBody
@ApiResultList('articles', ArticleListItemBody) // result: { articles: item[], count } (generic key forbidden)
```

Errors are also auto-extracted from domain exceptions:

```ts
@ApiErrors(ArticleNotFoundException, ArticleAlreadyPublishedException)  // documents the exception's code/status
```

## Decorator separation (controller readability)

Attaching all eight-element decorators to the controller hides the logic. Use `applyDecorators` to **bundle them into one per endpoint** and place them inside the `interface` layer.

```ts
// <domain>/interface/<domain>-controller-docs.ts
export const CreateArticleDocs = () => applyDecorators(
  ApiOperation({ operationId: 'createArticle', summary: '게시글 작성' }),
  ApiBody({ type: CreateArticleRequestBody }),
  ApiResult(CreateArticleResponseBody),
  ApiErrors(AuthUnauthorizedException, InvalidArticleTitleException),
);
```

- Shared utilities (`ApiResult`·`ApiErrors`) = `common/`. Domain-specific docs = that domain's `interface/`.

## CI enforcement (optional)

- Endpoints missing `@ApiOperation`/`operationId`, `result: any` returns, etc. can be blocked in CI.
- An `openapi.json` snapshot diff can surface spec changes in the PR (so you notice when the frontend needs regeneration).
