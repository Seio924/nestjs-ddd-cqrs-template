# 아키텍처 (→ `architecture/` 폴더 참조)

아키텍처 원칙은 **Rich Domain 4-Layer**이며, 상세는 `architecture/` 폴더가 기준 문서다.

- **원칙**: [`../architecture/design-principles.md`](../architecture/design-principles.md) — 기준
- **계층 의존 방향**: [`../architecture/layer-architecture.md`](../architecture/layer-architecture.md) — 4계층·금지 조합
- **폴더/파일 배치**: [`../architecture/directory-structure.md`](../architecture/directory-structure.md)
- **모듈 배선(도메인 경계·export 규칙)**: [`../architecture/module-pattern.md`](../architecture/module-pattern.md)
- **DDD·CQRS·repository·에러**: `../architecture/` 의 각 문서

> "의존성 방향(모든 화살표가 domain으로)·도메인 경계(남의 내부 import 금지, repository export 금지)"는 위 문서에서 4-Layer 기준으로 다룬다.

코드 관점 규칙은 [`code-style`](./code-style.md)·[`naming`](./naming.md)·[`nest`](./nest.md)·[`testing`](./testing.md)·[`enforcement`](./enforcement.md) 참조.
