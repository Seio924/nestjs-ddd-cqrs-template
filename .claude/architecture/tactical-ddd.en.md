> 🌐 [한국어](./tactical-ddd.md) · **English**

# Tactical DDD (domain layer building blocks)

> How to actually build the domain layer. 4 building blocks + core rules.
> For concepts see [design-principles.md](./design-principles.en.md); for location see [layer-architecture.md](./layer-architecture.en.md).
> This document uses a shopping-mall `Order` example to show both child entities and value objects. For the actual minimal sample, refer to the `article` domain (aggregate root + value object `ArticleTitle`).

---

## 1. The 4 Building Blocks (shopping-mall "Order" example)

```
Order  ← aggregate root = the boss, consistency boundary
  ├─ OrderLine[] (product lines)  ← entity (has ID, changed only through the root)
  ├─ Money (total)                ← value object (no ID, equal by value)
  ├─ customerId                   ← another aggregate (User) is referenced 'by ID only'
  └─ OrderPlaced (event)          ← a record of "an order was placed"
```

| Concept | Identity | Example | ID? | Equality basis |
|---|---|---|---|---|
| **aggregate root** | the boss, rule gatekeeper | Order | yes | ID |
| **entity** | subordinate under the boss | OrderLine | yes | ID |
| **value object** | a value with no ID | Money, ArticleTitle | no | value |
| **domain event** | a record of "something happened" | OrderPlaced | — | — |

---

## 2. Aggregate Root — the Boss + Consistency Boundary

- **Consistency boundary** = the boss of "one lump that always travels together and must always satisfy the rules."
- The things inside (entities·value objects) are changed **only through the boss** → the invariant never breaks.

```ts
export class Order {
  readonly id: string;
  private _lines: OrderLine[];        // private! can't be touched directly from outside
  private _status: string;
  private _total: Money;
  private readonly _events: DomainEvent[] = [];   // event collector

  static create(customerId: string): Order {       // creation only via static factory
    const order = new Order(customerId);
    order._events.push(new OrderCreated(order.id));
    return order;
  }

  addLine(productId: string, qty: number, price: Money): void {
    if (this._status !== 'DRAFT')
      throw new OrderNotEditableException();        // rule validation (invariant)
    this._lines.push(new OrderLine(productId, qty));
    this._total = this._total.add(price.multiply(qty));  // update the total 'together' too
    this._events.push(new OrderLineAdded(this.id, productId));  // record the event
  }
}
```

**Rules:**
- State is **private**, changed **only via methods** (no public setter → blocks bypassing the rules)
- Creation only via a **static factory** (`Order.create()`)
- A method does **rule validation + state change + event recording** at once

---

## 3. Entity vs Value Object (the most confusing distinction)

| | value object (Value Object) | entity (Entity) |
|---|---|---|
| Example | money, address, title | order product line, user |
| ID | **none** | **yes** |
| Equality | equal if values are equal | equal only if IDs are equal |
| Analogy | a 50,000-won bill (only the amount matters) | a person (distinguished by ID number even among namesakes) |

**The 3 traits of a value object:** ① immutable (readonly; to change, make a new instance) ② compared by value (`equals`) ③ self-validates on creation (if the value is invalid, creation itself is blocked → an invalid value cannot exist).
- The sample's `ArticleTitle` is a value object (created after length validation, immutable).

**Entity (subordinate):** has a unique ID but **is not saved/queried on its own.** Only through the root (e.g., `OrderLine` only through `Order`).

> Compromise on how strongly to adopt value objects: **only make VOs for values where the rules matter** (title·email·money, etc.), primitives for the rest. (Making everything a VO has high mapper conversion cost.)

---

## 4. Domain Event — a Record of "Something Happened"

```ts
export class OrderPlaced {
  constructor(
    public readonly orderId: string,   // all readonly (immutable)
    public readonly total: Money,
    public readonly occurredAt: Date,
  ) {}
}
```

- **Past-tense name** (`OrderPlaced`, `ArticlePublished` = "it happened")
- **Immutable** (something that already happened)
- **Carries all needed data** (so subscribers don't re-query)
- The aggregate piles them up in `_events` and then publishes → handles side effects (notifications, etc.). (design-principles §4)

---

## 5. 🔑 Core Rule: Reference Other Aggregates by ID Only

```ts
// ❌ object reference forbidden
class Order { private customer: User; }        // two lumps get tangled

// ✅ by ID only
class Order { readonly customerId: string; }   // knows only "customer #3's order"
```

**Why:** User is its own independent aggregate. If held as an object, it gets dragged along on save and shakes when User changes → **boundaries·transactions get tangled.** If held as just an ID, each stays independent, queried by ID when needed.
- Whether within the same BC or across BCs, **always reference by ID.** (The sample `Article` also references its author only via `authorId`)

---

## 6. Transaction Boundary

- **Bundle multiple aggregates into one transaction** (synchronous). With a single DB, atomicity is secured with a single-DB synchronous transaction, without Outbox. (design-principles §4)

---

## 7. One-Line Summary

> The aggregate root (Order) is the boss that manages the entities (OrderLine)·value objects (Money) inside it while enforcing the rules. State is changed only via private+methods, events are recorded on change, and other aggregates (User) are referenced by ID only. A value object is equal by value with no ID, and by wrapping it blocks invalid values at the source.
