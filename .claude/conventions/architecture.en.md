> 🌐 [한국어](./architecture.md) · **English**

# Architecture (→ see the `architecture/` folder)

The architectural principle is **Rich Domain 4-Layer**, and the `architecture/` folder is the authoritative reference for details.

- **Principles**: [`../architecture/design-principles.md`](../architecture/design-principles.en.md) — the baseline
- **Layer dependency direction**: [`../architecture/layer-architecture.md`](../architecture/layer-architecture.en.md) — 4 layers · forbidden combinations
- **Folder/file placement**: [`../architecture/directory-structure.md`](../architecture/directory-structure.en.md)
- **Module wiring (domain boundaries · export rules)**: [`../architecture/module-pattern.md`](../architecture/module-pattern.en.md)
- **DDD · CQRS · repository · errors**: each document under `../architecture/`

> "Dependency direction (all arrows point to domain) · domain boundaries (no importing another's internals, no exporting the repository)" are covered on the 4-Layer basis in the documents above.

For code-level rules, see [`code-style`](./code-style.en.md) · [`naming`](./naming.en.md) · [`nest`](./nest.en.md) · [`testing`](./testing.en.md) · [`enforcement`](./enforcement.en.md).
