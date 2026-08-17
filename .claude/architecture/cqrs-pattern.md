# CQRS 패턴 (읽기/쓰기 분리)

> command(쓰기)와 query(읽기)를 나누는 방식. repository/query 위치는 [layer-architecture.md](./layer-architecture.md), 트랜잭션은 [repository-pattern.md](./repository-pattern.md) 참고.

---

## 1. 핵심 아이디어 — Repository를 둘로 쪼갠다

일반적인 방식은 repository 하나에 읽기·쓰기를 다 담는다(단순 CRUD엔 충분). CQRS는 이를 **성격이 다른 둘로 분리**한다.

```
일반:      ArticleRepository (읽기 + 쓰기 다, 엔티티 반환)
                 ↓ 쪼개면
CQRS:  ArticleRepository (쓰기만)  +  ArticleQuery (읽기만)
```

| | Repository (쓰기용) | Query (읽기용) |
|---|---|---|
| 메서드 | `save`, `delete`, (쓰기 목적 조회) | `getArticle`, `listArticles` |
| 반환 | **도메인 애그리거트** (`Article`) | **화면용 DTO** (`GetArticleResult`) |
| 도메인 거침 | ✅ 애그리거트 복원(매퍼) | ❌ **도메인 건너뜀** (DB 직접) |
| 목적 | 규칙 적용 후 저장 | 빠르게 조회 |
| 포트/구현 | domain / infra | application / infra |

> **결정적 규칙:** QueryService는 **Repository를 절대 쓰지 않는다.** Repository는 애그리거트를 복원하는 **쓰기 전용** 통로다. 읽기는 별도 Query 통로를 쓴다.

---

## 2. "읽기가 도메인을 건너뛴다"의 의미

읽기가 **DB를 안 거치는 게 아니다.** 읽기도 DB 조회한다. 다만 **Repository 파일이 아니라 Query 파일**에서, **애그리거트 복원 없이** 화면 모양대로 조회한다.

**왜 애그리거트를 안 거치나:**
- 애그리거트는 **쓰기(규칙·불변식)에만** 필요하다.
- 목록(제목+작성자+상태)을 애그리거트로 복원하면 → 매퍼 낭비 + N+1 + 복잡.
- Query는 필요한 필드만 뽑아 **DTO로 직행** → 빠르고 단순.

```ts
// infrastructure/query/article-query-impl.ts — DB 직접, 애그리거트 안 만듦
async listArticles(query: ListArticlesQuery): Promise<ListArticlesResult> {
  const [rows, count] = await this.repo.createQueryBuilder('a')
    .select(['a.id', 'a.authorId', 'a.title', 'a.status', 'a.createdAt'])   // 화면 필드만
    .take(query.take).skip(query.page * query.take)
    .getManyAndCount();
  return { articles: rows.map(/* ... */), count };
}
```

---

## 3. 쓰기 흐름 (Command)

```
Controller → CommandService → 애그리거트 → Repository → DB
```

```ts
// application/command/article-command-service.ts
@Injectable()
export class ArticleCommandService {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository) {}

  @Transactional()
  async publish(id: string): Promise<void> {
    const article = await this.articleRepo.findById(id);   // 애그리거트 로드
    if (!article) throw new ArticleNotFoundException();
    article.publish();                                     // 도메인 규칙 적용
    await this.articleRepo.save(article);                  // 저장
  }
}
```

---

## 4. 읽기 흐름 (Query)

```
Controller → QueryService → Query 포트 → QueryImpl (DB 직접)
```

```ts
// application/query/article-query-service.ts
@Injectable()
export class ArticleQueryService {
  constructor(@Inject(ARTICLE_QUERY) private readonly articleQuery: ArticleQuery) {}

  async getArticle(id: string): Promise<GetArticleResult> {
    const article = await this.articleQuery.getArticle(id);   // Query에 위임 (Repository 안 씀!)
    if (!article) throw new ArticleNotFoundException();
    return article;
  }
}

// application/query/article-query.ts — Query 포트
export interface ArticleQuery {
  getArticle(id: string): Promise<GetArticleResult | null>;
}
export const ARTICLE_QUERY = 'ArticleQuery';
```

---

## 5. CommandBus 없이 (service 메서드)

`@nestjs/cqrs`의 **CommandBus/QueryBus + @CommandHandler 클래스는 쓰지 않는다.** 유스케이스마다 Command 객체 + `@CommandHandler` 클래스로 파일이 폭발하고, 현재 규모엔 과하다(design-principles §6). 대신 **command/query service를 그냥 클래스로** 만들고 controller가 직접 호출한다.

- controller는 `commandService.publish(id)`처럼 service 메서드를 직접 부른다(`commandBus.execute(cmd)` 아님).
- 유스케이스 단위는 Command 객체가 아니라 service의 메서드다.
- **입력 DTO는 유지**(class-validator 검증). 단 "Command 객체로 버스에 태우는" 것만 안 한다.

---

## 6. 유지 vs 제거 정리

| CQRS 요소 | 채택? |
|---|---|
| command/query 폴더·service 분리 | ✅ |
| **Query는 Repository 안 씀 (읽기 전용 별도 통로)** | ✅ (핵심) |
| 읽기는 도메인 건너뛰고 DB 직접 → DTO | ✅ |
| 입력 DTO + class-validator | ✅ |
| CommandBus/QueryBus, @CommandHandler, CqrsModule | ❌ (service 메서드로 대체) |

CommandBus는 **껍데기(전달 방식)**일 뿐, CQRS의 알맹이(읽기/쓰기 분리 + Query 별도 통로)는 그대로 유지한다.

---

## 7. 한 줄 요약

> CQRS는 "repository 하나"를 Repository(쓰기, 애그리거트 반환)와 Query(읽기, DTO 반환)로 쪼갠 것이다. 읽기는 도메인을 건너뛰고 DB에서 화면 모양대로 조회해 빠르다. CommandBus를 빼고 command/query service를 클래스로 만들어 controller가 직접 호출한다.
