> 🌐 [한국어](./testing.md) · **English**

# Testing

## What to test and how far

| Layer | Test kind | Scope |
|---|---|---|
| Domain (aggregate) | **Unit test (primary)** | Rules · invariants · exceptions. Pure TS, so no mocks needed. |
| Service | **Unit test** | Public methods. Repository is mocked. |
| Repository | Integration test (selective) | Complex queries only. Uses a test DB. |
| Controller | E2E (selective) | Core API flows only. |

- 🔴 Write tests for domain rules (aggregate methods) and for a Service's public methods.
- ⚪ Methods that only do a simple 1-line delegate are exempt.

## Must-test items

1. **Business rule violations** — invalid state transitions, missing permissions, accessing a closed resource
2. **Boundary conditions** — empty results, zero count, maximum length, first/last item
3. **Exception paths** — looking up a missing resource, duplicate creation, invalid state transition
4. **The exception's type** — verify it is a domain exception class, not a generic Error

```ts
// ✅ verify the exception type too
expect(() => article.publish()).toThrow(ArticleAlreadyPublishedException)
```

> A `@Transactional` method needs a real DB tx, so in unit tests either disable the decorator with `jest.mock('typeorm-transactional')` or verify it with an integration test.

## What not to test

- Framework behavior (whether Nest DI works)
- Library behavior (whether TypeORM issues queries)
- What the type system already guarantees
- Simple getters/delegation

## Test names

- `describe` — **English**. Name the test target (class name, method name) identically to the code.
- `it` — **Korean**. Describe the behavior in the form "~하면 ~한다".

```ts
describe('ArticleCommandService', () => {
  describe('publish', () => {
    it('없는 글을 발행하면 ArticleNotFoundException을 던진다', async () => {})
    it('이미 발행된 글을 또 발행하면 ArticleAlreadyPublishedException을 던진다', async () => {})
  })
})
```

- 🔴 No rote English expressions like `it('should ...')`. Write in Korean what is guaranteed.

## Test structure

- 🟡 Write in given-when-then order. Add comments only when needed.
- 🔴 Test file location: same folder as the target file, `*.spec.ts`
- 🔴 E2E goes in the `test/` folder, `*.e2e-spec.ts`

## Coverage

- ⚪ Do not enforce numeric targets. Chasing coverage breeds meaningless tests.
- 🟡 Instead, confirm in review that nothing from [Must-test items](#must-test-items) is missing.
