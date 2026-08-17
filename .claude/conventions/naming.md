# 네이밍

파일명은 **kebab-case + 하이픈 역할 접미사**를 쓴다. 파일별 상세 배치는 [directory-structure](../architecture/directory-structure.md) 기준.

## 파일

kebab-case + **하이픈** 역할 접미사.

```
article-module.ts
article-controller.ts
article-command-service.ts            # command / query service
article-repository.ts                 # 포트(domain)
article-repository-impl.ts            # 구현(infra)
create-article-request-body.ts        # DTO (요청/응답 body·param·query)
article-exceptions.ts                 # 도메인당 예외 '한 파일'에 여러 클래스
article-error-code.ts / article-error-message.ts   # 코드·메시지 상수
article-command-service.spec.ts       # 테스트는 .spec.ts 유지
```

**예외 규칙 — Nest 프레임워크 프리미티브는 점 접미사 유지**: `.guard.ts`·`.filter.ts`·`.interceptor.ts`·`.pipe.ts`·`.decorator.ts`·`.spec.ts`·`.entity.ts`. 린터/CLI/커뮤니티 툴이 이 패턴을 glob으로 잡기 때문(예: `jwt-auth.guard.ts`, `all-exceptions.filter.ts`, `article.entity.ts`). **그 외 우리 도메인/애플리케이션/인프라 역할 파일은 전부 하이픈.**

## 클래스

PascalCase + 역할 접미사. `ArticleCommandService`, `CreateArticleRequestBody`, `ArticleNotFoundException`

## 그 외

| 대상 | 규칙 | 예시 |
|---|---|---|
| 폴더 | kebab-case | `article/` |
| 변수·함수 | camelCase | `authorId` |
| 상수 | UPPER_SNAKE_CASE | `MAX_TITLE_LENGTH` |
| 타입·인터페이스 | PascalCase | `ArticleListItem` |

## 메서드 이름

- 동사로 시작한다.
- boolean 반환은 `is` / `has` / `can` 으로 시작한다.
- 조회는 의도를 드러낸다: `findById`(없으면 null) vs `getById`(없으면 예외)

```ts
findById(id: string): Promise<Article | null>
getById(id: string): Promise<Article>            // 없으면 예외
canEdit(article: Article): boolean
publish(id: string): Promise<void>
```
