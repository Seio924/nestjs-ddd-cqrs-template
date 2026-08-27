> 🌐 [한국어](./code-style.md) · **English**

# Code Style

## Size

| Item | Lint (🔴) | Target (🟡) |
|---|---|---|
| Function length | 20 lines | 10 lines |
| Nesting depth | 3 | 2 |
| Function argument count | 4 | 3 or fewer; wrap in an object if more |
| File length | 300 lines | 200 lines |

- When a function exceeds 10 lines, re-check "does it do only one thing?"
- Cases that unavoidably grow long (transaction orchestration, etc.) are allowed, but confirm the reason in review.

## Control flow

- 🟡 **Use early return.** Avoid `else`.

```ts
// ❌
function getDiscount(user: User) {
  if (user.isPremium) {
    return 0.2
  } else {
    return 0
  }
}

// ✅
function getDiscount(user: User) {
  if (user.isPremium) return 0.2
  return 0
}
```

- 🟡 Group guard clauses at the top of the function.

## Types

- 🔴 No `any`. If unavoidable, use `unknown` + narrowing.
- 🔴 Do not prefix interfaces with `I`. (`IUser` ❌ → `User` ✅)
- 🟡 Specify return types. (Required for public methods.)

## Values

- 🔴 No magic numbers/strings. Extract them into constants.

```ts
// ❌
if (title.length > 200) { ... }

// ✅
const MAX_TITLE_LENGTH = 200
if (title.length > MAX_TITLE_LENGTH) { ... }
```

- 🟡 Constants use `UPPER_SNAKE_CASE` and are collected in a per-domain constant file.

## Chaining

- 🟡 **Chaining that digs into an object's internals is limited to 2 levels.** Beyond that, extract a function.
- ⚪ Array method chaining (`.filter().map()`) is not restricted. However, if it exceeds 3 levels, give it a name via an intermediate variable.

```ts
// ❌ digs into another's internals
const name = order.customer.profile.displayName.trim()

// ✅ receive only what you need, or extract a function
const name = getCustomerDisplayName(order)
```

## Async

- 🔴 No leaving promises unhandled without `await` (floating promise).
- 🟡 When sequential execution is unnecessary, use `Promise.all`.
