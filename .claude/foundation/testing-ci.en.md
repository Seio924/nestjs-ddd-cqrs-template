> 🌐 [한국어](./testing-ci.md) · **English**

# Testing & CI

## Testing ([Code Conventions §Testing](../conventions/testing.en.md))

- Domain aggregate unit tests (rules·invariants) + Service unit tests (repository mock) are the mainstay.
- Only complex queries get Repository integration tests (test DB); only core flows get e2e (Supertest).
- Files: `*.spec.ts` in the same folder as the target. e2e goes in `test/` as `*.e2e-spec.ts`.
- Foundation self-verification (response wrapping·exception filter·global guard `@Public` behavior) is kept as an integration spec (see the sample's `common/api-contract.spec.ts`).

---

## CI ([Code Conventions §Enforcement](../conventions/enforcement.en.md))

- On PR: `lint + test + build`. Merge is blocked on failure.
- Architecture boundary lint (eslint-plugin-boundaries) prevents layer/domain violations.
