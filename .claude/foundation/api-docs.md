# API 문서 (Swagger)

목표: **"백엔드 코드 안 봐도, 스웨거만 보면 프론트가 구현된다."** 문서는 선택이 아니라 강제다.

## 기본

- `@nestjs/swagger`로 `/docs` 노출(운영은 비노출).
- DTO의 class-validator + `@ApiProperty`로 스펙 자동 생성 → 프론트가 orval 등으로 타입/클라이언트를 생성하는 소스. 스웨거 품질 = 프론트 개발 경험.

## 엔드포인트마다 필수 요소

① `@ApiTags` ② `@ApiOperation({ operationId, summary })` ③ `@ApiBody`(요청 타입) ④ 성공 응답 타입(봉투 포함) ⑤ 에러별 응답(status + 에러코드) ⑥ DTO 필드별 `@ApiProperty`(example·제약).

## 봉투 응답을 정확히 — 제네릭 래퍼 `ApiResult` (🔴 핵심)

응답은 `{ code, message, result }` 봉투다. 그냥 두면 스웨거가 `result`를 `any`로 뱉는다. **제네릭 래퍼 + 헬퍼 데코레이터**로 `result` 자리에 실제 타입을 주입한다.

```ts
@ApiResult(ArticleResponseBody)                 // result: ArticleResponseBody
@ApiResultList('articles', ArticleListItemBody) // result: { articles: item[], count } (제네릭 키 금지)
```

에러도 도메인 예외에서 자동 추출:

```ts
@ApiErrors(ArticleNotFoundException, ArticleAlreadyPublishedException)  // 예외의 code/status를 문서로
```

## 데코레이터 분리 (컨트롤러 가독성)

8요소 데코레이터를 컨트롤러에 다 붙이면 로직이 안 보인다. `applyDecorators`로 **엔드포인트당 하나로 묶어** `interface` 레이어 안에 둔다.

```ts
// <domain>/interface/<domain>-controller-docs.ts
export const CreateArticleDocs = () => applyDecorators(
  ApiOperation({ operationId: 'createArticle', summary: '게시글 작성' }),
  ApiBody({ type: CreateArticleRequestBody }),
  ApiResult(CreateArticleResponseBody),
  ApiErrors(AuthUnauthorizedException, InvalidArticleTitleException),
);
```

- 공용 유틸(`ApiResult`·`ApiErrors`) = `common/`. 도메인 전용 문서 = 그 도메인의 `interface/`.

## CI 강제 (선택)

- `@ApiOperation`/`operationId` 없는 엔드포인트, `result: any` 반환 등을 CI에서 막을 수 있다.
- `openapi.json` 스냅샷 diff로 스펙 변경을 PR에 드러낼 수 있다(프론트 재생성 타이밍 인지).
