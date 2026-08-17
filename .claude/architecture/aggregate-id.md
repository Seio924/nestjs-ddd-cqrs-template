# 애그리거트 ID 생성

> ID를 누가·어디서·어떻게 만드는가. 애그리거트는 [tactical-ddd.md](./tactical-ddd.md), 저장은 [repository-pattern.md](./repository-pattern.md) 참고.

---

## 1. 핵심 원칙 — ID는 DB가 아니라 도메인이 만든다

```ts
// domain — 애그리거트가 태어날 때 스스로 ID 생성 (DB 저장 전에!)
export class Article {
  private constructor(readonly id: string, ...) {}

  static create(authorId: string): Article {
    return new Article(generateId(), authorId);   // ← 도메인이 ID 생성
  }
  static restore(props: { id: string; authorId: string }): Article {
    return new Article(props.id, props.authorId);  // ← DB 복원 시 기존 ID 유지
  }
}
```

Spring/JPA의 `@GeneratedValue(IDENTITY)`(DB auto-increment)와 **정반대**. DB가 아니라 애그리거트가 `create` 시점에 ID를 만든다.

---

## 2. 왜 도메인이 만드나

1. **도메인 순수성** — DB가 ID를 만들면 저장 전 애그리거트는 불완전(id 없음) → 도메인이 DB에 의존. 도메인이 만들면 DB 없이도 완전한 애그리거트.
2. **저장 전 ID 필요** — 저장 전에 그 ID로 다른 작업(교차 도메인 호출 등)을 하려면 미리 ID가 있어야 함.
3. **이벤트에 ID 담기** — `ArticleCreated` 이벤트에 id를 담으려면 create 시점에 ID가 있어야 함.

---

## 3. `create()` vs `restore()`

- `create()` — 새 애그리거트. 새 ID 생성.
- `restore()` — DB에서 불러온 것. 기존 ID 유지. repository의 `toModel`이 호출.

---

## 4. Repository·TypeORM은 ID를 그대로 받는다

```ts
// TypeORM 엔티티 — @PrimaryGeneratedColumn(자동생성) 아님!
@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn()   // ← 그냥 받음. DB가 ID 안 만듦
  id: string;
}
// repository 매퍼 — 도메인 ID 그대로 저장
private toEntity(a: Article): ArticleEntity {
  const e = new ArticleEntity();
  e.id = a.id;   // 도메인이 만든 ID 그대로
  return e;
}
```

---

## 5. ID 형식 — 공유 헬퍼 한 곳에서

ID 생성은 `common/generate-id.ts` 한 곳에 둔다. 형식을 바꾸려면 이 함수만 교체하면 된다.

```ts
import { randomUUID } from 'node:crypto';

/** 기본은 UUID v4. 정렬 가능 ID가 필요하면 uuidv7/ULID/cuid2로 이 함수만 교체. */
export function generateId(): string {
  return randomUUID();
}
```

- 기본값은 의존성 없는 **UUID v4**(`node:crypto`).
- **정렬 가능 ID**(생성 시각순 인덱스 이점)가 필요하면 **UUID v7 / ULID / cuid2**로 교체.
- **auto-increment는 쓰지 않는다** (도메인 ID 생성 원칙과 충돌 + 순차 추측 보안 문제).

---

## 6. 배경: auto-increment vs 생성형 ID (선택 근거)

| | auto-increment | 생성형 ID (UUID/ULID) |
|---|---|---|
| DB 인덱스 성능 | ✅ 최고(순차) | UUIDv4 ▲(랜덤) / UUIDv7·ULID ✅(정렬됨) |
| 도메인이 생성 가능 | ❌ (DB가 만듦) | ✅ |
| 순차 추측 보안 | ❌ 취약(IDOR) | ✅ 안전 |
| 분산 충돌 | ❌ | ✅ |

생성형 ID를 쓰는 이유는 **①DDD(도메인이 ID 생성) ②보안(추측 방지)** 때문. auto-increment는 단순 CRUD엔 지금도 유효하나, 이 템플릿의 DDD 원칙과 충돌해 채택하지 않는다.

---

## 7. 한 줄 요약

> ID는 DB(auto-increment)가 아니라 도메인 애그리거트가 `create()` 시점에 생성한다(도메인 순수성·저장 전 참조·이벤트). TypeORM은 `@PrimaryColumn`으로 그대로 받는다. 형식은 `common/generate-id.ts` 한 곳에서 관리하며 기본 UUID v4, 필요 시 정렬 가능 ID로 교체.
