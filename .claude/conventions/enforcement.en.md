> 🌐 [한국어](./enforcement.md) · **English**

# Enforcement

| Layer | When | What it blocks |
|---|---|---|
| Editor | While writing | Red squiggles (immediate feedback) |
| pre-commit | On commit | Lint on the changed files |
| CI | On PR | Full lint + test + build. Merge blocked on failure |

CI is the last line of defense. Local setups can vary from person to person, so CI is mandatory.

## Architecture boundary lint (eslint-plugin-boundaries)

Layer/domain boundaries are baked into `eslint.config.mjs` as rules, so violating them fails the build:

1. No direct import from Controller (interface) → Repository implementation (infra) (go through application)
2. No import from Infrastructure → another domain (only in the adapter implementation)
3. No import from Domain → another layer (domain is a leaf)
4. No direct import of internal files across domains (no bypassing module exports)

For rule details, see `boundaries/elements` · `boundaries/dependencies` in `eslint.config.mjs`; for the concept, see [layer-architecture](../architecture/layer-architecture.en.md).
