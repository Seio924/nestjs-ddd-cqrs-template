# 전술적 DDD (도메인 레이어 구성 요소)

> domain 레이어를 실제로 어떻게 짜는가. 4가지 부품 + 핵심 규칙.
> 개념은 [design-principles.md](./design-principles.md), 위치는 [layer-architecture.md](./layer-architecture.md) 참고.
> 이 문서는 자식 엔티티·값 객체를 모두 보여주려고 쇼핑몰 `Order` 예시를 쓴다. 실제 최소 샘플은 `article` 도메인(애그리거트 루트 + 값 객체 `ArticleTitle`)을 참고.

---

## 1. 4가지 부품 (쇼핑몰 "주문(Order)" 예시)

```
Order (주문)  ← 애그리거트 루트 = 대장, 일관성 경계
  ├─ OrderLine[] (상품라인들)  ← 엔티티 (ID 있음, 루트 통해서만 변경)
  ├─ Money (총액)              ← 값 객체 (ID 없음, 값으로 같음)
  ├─ customerId                ← 다른 애그리거트(User)는 'ID로만' 참조
  └─ OrderPlaced (이벤트)      ← "주문됐다" 기록
```

| 개념 | 정체 | 예 | ID? | 같음 판단 |
|---|---|---|---|---|
| **애그리거트 루트** | 대장, 규칙 문지기 | Order | 있음 | ID |
| **엔티티** | 대장 밑 부하 | OrderLine | 있음 | ID |
| **값 객체** | ID 없는 값 | Money, ArticleTitle | 없음 | 값 |
| **도메인 이벤트** | "~했다" 기록 | OrderPlaced | — | — |

---

## 2. 애그리거트 루트 — 대장 + 일관성 경계

- **일관성 경계** = "항상 함께 붙어다니고, 항상 규칙에 맞아야 하는 한 덩어리"의 대장.
- 안의 것들(엔티티·값객체)은 **대장을 거쳐서만** 변경 → 불변식이 절대 안 깨짐.

```ts
export class Order {
  readonly id: string;
  private _lines: OrderLine[];        // private! 밖에서 직접 못 건드림
  private _status: string;
  private _total: Money;
  private readonly _events: DomainEvent[] = [];   // 이벤트 수집함

  static create(customerId: string): Order {       // 생성은 static 팩토리로만
    const order = new Order(customerId);
    order._events.push(new OrderCreated(order.id));
    return order;
  }

  addLine(productId: string, qty: number, price: Money): void {
    if (this._status !== 'DRAFT')
      throw new OrderNotEditableException();        // 규칙 검증 (불변식)
    this._lines.push(new OrderLine(productId, qty));
    this._total = this._total.add(price.multiply(qty));  // 총액도 '같이' 갱신
    this._events.push(new OrderLineAdded(this.id, productId));  // 이벤트 기록
  }
}
```

**규칙:**
- 상태는 **private**, 변경은 **메서드로만** (public setter 금지 → 규칙 우회 차단)
- 생성은 **static 팩토리**(`Order.create()`)로만
- 메서드가 **규칙 검증 + 상태 변경 + 이벤트 기록**을 동시에

---

## 3. 엔티티 vs 값 객체 (제일 헷갈리는 구분)

| | 값 객체 (Value Object) | 엔티티 (Entity) |
|---|---|---|
| 예 | 돈, 주소, 제목 | 주문상품 라인, 사용자 |
| ID | **없음** | **있음** |
| 같음 | 값이 같으면 같음 | ID가 같아야 같음 |
| 비유 | 5만원 지폐 (금액만 봄) | 사람 (동명이인도 주민번호로 구분) |

**값 객체 3특징:** ①불변(readonly, 바꾸려면 새 인스턴스) ②값으로 비교(`equals`) ③생성 시 자가검증(잘못된 값이면 생성 자체를 막음 → 잘못된 값이 존재 불가).
- 샘플의 `ArticleTitle`이 값 객체다(길이 검증 후 생성, 불변).

**엔티티(부하):** 고유 ID가 있지만 **혼자 저장/조회 안 됨.** 루트를 통해서만(예: `OrderLine`은 `Order`를 통해서만).

> 값 객체 도입 강도는 절충한다: **규칙이 중요한 값만 VO**(제목·이메일·돈 등), 나머진 원시타입. (전부 VO는 매퍼 변환 비용이 크다.)

---

## 4. 도메인 이벤트 — "~했다" 기록

```ts
export class OrderPlaced {
  constructor(
    public readonly orderId: string,   // 다 readonly (불변)
    public readonly total: Money,
    public readonly occurredAt: Date,
  ) {}
}
```

- **과거형 이름** (`OrderPlaced`, `ArticlePublished` = "~됐다")
- **불변**(이미 일어난 일)
- **필요한 데이터 다 담음**(구독자가 다시 조회 안 하게)
- 애그리거트가 `_events`에 쌓아뒀다가 발행 → 부수효과(알림 등) 처리. (design-principles §4)

---

## 5. 🔑 핵심 규칙: 다른 애그리거트는 ID로만 참조

```ts
// ❌ 객체 참조 금지
class Order { private customer: User; }        // 두 덩어리가 엉킴

// ✅ ID로만
class Order { readonly customerId: string; }   // "3번 손님 주문"만 앎
```

**왜:** User는 User대로 독립 애그리거트다. 객체로 들면 저장 시 딸려오고 User 변경에 흔들려 → **경계·트랜잭션이 엉킴.** ID만 들면 각자 독립, 필요 시 ID로 조회.
- 같은 BC 안이든 BC를 넘든 **항상 ID 참조.** (샘플 `Article`도 작성자를 `authorId`로만 참조)

---

## 6. 트랜잭션 경계

- **여러 애그리거트를 한 트랜잭션**에 묶는다 (동기). 단일 DB라 Outbox 없이 단일 DB 동기 트랜잭션으로 원자성을 확보한다. (design-principles §4)

---

## 7. 한 줄 요약

> 애그리거트 루트(Order)는 안의 엔티티(OrderLine)·값객체(Money)를 규칙 지키며 관리하는 대장이다. 상태는 private+메서드로만 바꾸고, 변경 시 이벤트를 기록하며, 다른 애그리거트(User)는 ID로만 참조한다. 값객체는 ID 없이 값으로 같고, 감싸서 잘못된 값을 원천 차단한다.
