# 코드 스타일

## 크기

| 항목 | 린트(🔴) | 목표(🟡) |
|---|---|---|
| 함수 길이 | 20줄 | 10줄 |
| 중첩 depth | 3 | 2 |
| 함수 인자 수 | 4개 | 3개 이하, 넘으면 객체로 |
| 파일 길이 | 300줄 | 200줄 |

- 함수가 10줄을 넘으면 "한 가지 일만 하는가"를 다시 본다.
- 어쩔 수 없이 길어지는 경우(트랜잭션 orchestration 등)는 허용하되, 리뷰에서 이유를 확인한다.

## 제어 흐름

- 🟡 **early return을 쓴다.** `else`는 피한다.

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

- 🟡 가드 절을 함수 맨 위에 모은다.

## 타입

- 🔴 `any` 금지. 불가피하면 `unknown` + 좁히기.
- 🔴 인터페이스에 `I` 접두사를 붙이지 않는다. (`IUser` ❌ → `User` ✅)
- 🟡 반환 타입을 명시한다. (public 메서드는 필수)

## 값

- 🔴 매직 넘버/문자열 금지. 상수로 추출한다.

```ts
// ❌
if (title.length > 200) { ... }

// ✅
const MAX_TITLE_LENGTH = 200
if (title.length > MAX_TITLE_LENGTH) { ... }
```

- 🟡 상수는 `UPPER_SNAKE_CASE`, 도메인별 constant 파일에 모은다.

## 체이닝

- 🟡 **객체 내부를 파고드는 체이닝은 2단계까지.** 그 이상은 함수로 뽑는다.
- ⚪ 배열 메서드 체이닝(`.filter().map()`)은 제한하지 않는다. 다만 3단계를 넘으면 중간 변수로 이름을 붙인다.

```ts
// ❌ 남의 내부를 파고든다
const name = order.customer.profile.displayName.trim()

// ✅ 필요한 것만 받거나, 함수로 뽑는다
const name = getCustomerDisplayName(order)
```

## 비동기

- 🔴 `await` 없는 promise 방치 금지 (floating promise).
- 🟡 순차 실행이 불필요하면 `Promise.all`을 쓴다.
