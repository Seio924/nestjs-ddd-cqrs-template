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

### 조회 메서드 이름 (레이어별)

조회 이름은 두 가지가 정한다: **없으면 null이냐 예외냐**, 그리고 **어느 레이어냐**.

| 레이어 | 단건 | 리스트 |
|---|---|---|
| **Repository** (애그리거트, infra) | `findById` · `findBy<Field>` — 없으면 **null** | `find<Nouns>(criteria)` |
| **Command service** (자기 애그리거트 로드 헬퍼) | `get<Entity>` — 없으면 **예외** | (보통 repo `find<Nouns>`에 위임) |
| **Query** (DTO 읽기, CQRS) | `get<화면>` — DTO 반환(null 가능) | `get<Nouns>` · `search<Nouns>` |

- **키가 여럿인 repository**는 `By<Field>`로 키를 드러낸다: `findById` · `findBySlug`.
- **command service가 자기 애그리거트 하나를 로드해 없으면 예외**를 던지는 헬퍼는 `get<Entity>`: `getArticle`. (`getById` 아님 — 대상을 이름에 드러내 호출부가 자명)
- **리스트에는 null/예외 구분이 없다** — 0개는 정상(빈 배열). repo면 `find<Nouns>`, query면 `get<Nouns>`/`search<Nouns>`.

```ts
findById(id: string): Promise<Article | null>                    // repository 단건 (없으면 null)
findArticles(criteria: FindArticlesCriteria): Promise<Article[]> // repository 리스트
private getArticle(id: string): Promise<Article>                 // command 로드+없으면 예외
searchArticles(q: SearchArticlesQuery): Promise<SearchArticlesResult> // query 읽기(DTO)
canEdit(article: Article): boolean                               // boolean = is/has/can
publish(id: string): Promise<void>
```
