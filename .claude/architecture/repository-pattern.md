# 리포지토리 패턴 (도메인 ↔ TypeORM)

> 순수 도메인과 TypeORM DB를 잇는 곳. 포트/구현/매퍼/트랜잭션.
> 포트 위치는 [layer-architecture.md](./layer-architecture.md) §4, 애그리거트는 [tactical-ddd.md](./tactical-ddd.md) 참고.

---

## 1. 포트 (domain) + 구현 (infra)

```ts
// domain/article-repository.ts — 포트 (interface + InjectionToken)
export interface ArticleRepository {
  findById(id: string): Promise<Article | null>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
export const ARTICLE_REPOSITORY = 'ArticleRepository';
```

구현은 infra에, TypeORM은 여기서만 import.

---

## 2. 매퍼 — 순수 도메인 ↔ TypeORM (핵심)

repository 구현 안에 **두 변환 함수**가 두 세계를 잇는 유일한 다리다.

```
저장: 도메인 Article → toEntity → ArticleEntity(TypeORM) → DB
조회: DB → ArticleEntity(TypeORM) → toModel → 도메인 Article
```

```ts
// infrastructure/repository/article-repository-impl.ts
@Injectable()
export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(
    @InjectRepository(ArticleEntity) private readonly repo: Repository<ArticleEntity>,
  ) {}

  async findById(id: string): Promise<Article | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async save(article: Article): Promise<void> {
    await this.repo.save(this.toEntity(article));
  }

  // 매퍼: 도메인 → TypeORM 엔티티
  private toEntity(a: Article): ArticleEntity {
    const e = new ArticleEntity();
    e.id = a.id;
    e.authorId = a.authorId;
    e.title = a.title;
    e.content = a.content;
    return e;
  }

  // 매퍼: TypeORM 엔티티 → 도메인
  private toModel(e: ArticleEntity): Article {
    return Article.restore({ id: e.id, authorId: e.authorId, title: e.title, content: e.content });
  }
}
```

- **두 종류의 엔티티가 다른 클래스다:** 도메인 `Article`(순수 규칙) vs `ArticleEntity`(`@Entity`·`@Column`, TypeORM). 매퍼가 변환.
- 이 매퍼가 "TypeORM 써도 도메인은 순수"의 비용(세금). **repository 구현 안에만 존재.**

---

## 3. 메서드 네이밍 & update 금지

| 목적 | 패턴 | 예 |
|---|---|---|
| 단건 조회 | `findById` | `findById(id)` |
| 목록 조회 | `find<Noun>s` | `findArticles(criteria)` |
| 저장/업서트 | `save` | `save(article)` |
| 삭제 | `delete` | `delete(id)` |

- ⚠️ `update` 메서드 금지 (🔴). repository에 `updateArticle(id, {...})` 두지 않는다.
  - 반드시 **로드 → 도메인 메서드 → save** 흐름:
    ```ts
    const article = await this.articleRepo.findById(id);
    article.edit(dto.title, dto.content);   // 도메인 규칙 통과
    await this.articleRepo.save(article);
    ```
  - 이유: repository update를 열면 규칙을 우회해 DB 직접 수정이 가능해진다.
- ✅ `findById` 허용. 단일 조회를 `findArticles({take:1}).pop()`로 강제하기보다 `findById(id)` 한 줄이 명확하다.

---

## 4. 트랜잭션 — `@Transactional()` (Spring 방식)

`typeorm-transactional` 라이브러리의 `@Transactional()` 채택. Spring `@Transactional`과 동일한 경험 — tx를 파라미터로 넘기지 않는다.

```ts
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ArticleCommandService {
  @Transactional()                              // ← 이 메서드 전체가 한 트랜잭션
  async publish(id: string): Promise<void> {
    const article = await this.articleRepo.findById(id);
    if (!article) throw new ArticleNotFoundException();
    article.publish();
    await this.articleRepo.save(article);          // 자동으로 같은 트랜잭션
    // await this.pointAdapter.grant(article.authorId);  // 교차 도메인도 같은 트랜잭션(있다면)
  }
}
```

**원리:** Spring은 ThreadLocal에 현재 트랜잭션을 저장 → Node엔 없으므로 `AsyncLocalStorage`(CLS)로 같은 트릭. repository는 CLS에서 현재 트랜잭션을 자동으로 찾아 참여하므로 **tx를 몰라도 되고 시그니처가 깨끗**하다.

셋업 (한 번, `main.ts`):
```ts
import { initializeTransactionalContext } from 'typeorm-transactional';
initializeTransactionalContext();   // 앱 부트스트랩 전에
```

- 이 방식이 원자적 쓰기 교차를 한 트랜잭션에 묶어 **진짜 원자성**을 준다 (design-principles §4).
- ⚠️ `@Transactional`은 프록시 기반이라 "같은 클래스 내부 직접 호출 시 무시"되는 함정은 Spring과 동일 → 주의.
- ⚠️ 단위 테스트에서 `@Transactional` 메서드는 실제 DB tx가 필요하므로 `jest.mock('typeorm-transactional')`로 데코레이터를 무력화하거나, 테스트 DB를 쓰는 통합 테스트로 검증한다.

---

## 5. Soft Delete + Cascade

**Soft Delete** — 물리 삭제 대신 `deletedAt` 기록. 조회 시 자동 제외.
```ts
@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn() id: string;
  @DeleteDateColumn() deletedAt?: Date;
}
// repository
await this.repo.softDelete({ id });   // 논리 삭제 (deletedAt 채움)
// 조회는 deletedAt IS NULL 자동 적용 (필요 시 withDeleted()로 포함)
```
삭제 데이터 복구·감사 추적이 가능하다.

**Cascade** — 애그리거트 저장/삭제 시 자식 엔티티도 함께.
```ts
async save(order: Order): Promise<void> {
  await this.repo.save(this.toEntity(order));                // 루트
  for (const item of order.items) await this.saveItem(item); // 자식(엔티티)
}
```
애그리거트는 한 덩어리 → service는 `save(root)` 한 번만 호출, repository가 자식까지 처리.

---

## 6. 도메인 이벤트 발행 (Outbox 아님)

**Outbox 미도입.** 단일 DB라 이벤트를 별도 Outbox 테이블에 적재해 최종 일관성으로 전달할 필요가 없다.
- 저장 성공 후 **Nest EventEmitter**로 발행 (부수효과용 — 알림 등).
```ts
async save(article: Article): Promise<void> {
  await this.repo.save(this.toEntity(article));
  article.pullEvents().forEach(e => this.eventEmitter.emit(e.constructor.name, e));
}
```

---

## 7. 결정 요약

| 요소 | 결정 |
|---|---|
| 매퍼 (toEntity/toModel) | ✅ 채택 (repository 구현 안) |
| `update` 메서드 금지 | ✅ 채택 (로드→도메인메서드→save) |
| `findById` | ✅ 허용 (단일 find 강제 안 함) |
| 트랜잭션 | `@Transactional()` (typeorm-transactional, Spring 방식) — manager 전파 안 함 |
| Soft Delete | ✅ 채택 |
| Cascade 저장/삭제 | ✅ 채택 |
| Outbox / 이벤트 발행 | ❌ Outbox 미도입 → EventEmitter |

---

## 8. 한 줄 요약

> repository 구현이 매퍼로 순수 도메인 ↔ TypeORM 엔티티를 변환한다(유일한 다리). update는 금지하고 로드→도메인메서드→save로만 수정한다. 트랜잭션은 `@Transactional()`(Spring 방식, tx 안 넘김)으로 원자성을 얻고, soft delete·cascade를 쓰며, 이벤트는 Outbox 없이 EventEmitter로 발행한다.
