# 강제 방법

| 층위 | 시점 | 막는 것 |
|---|---|---|
| 에디터 | 작성 중 | 빨간 줄 (즉시 피드백) |
| pre-commit | 커밋 시 | 변경된 파일의 lint |
| CI | PR 시 | 전체 lint + 테스트 + 빌드. 실패 시 머지 불가 |

CI가 최종 방어선이다. 로컬 설정은 사람마다 다를 수 있으므로 CI를 반드시 건다.

## 아키텍처 경계 린트 (eslint-plugin-boundaries)

`eslint.config.mjs`에 레이어/도메인 경계가 규칙으로 박혀 있어, 어기면 빌드가 실패한다:

1. Controller(interface) → Repository 구현(infra) 직접 import 금지 (application 경유)
2. Infrastructure → 남의 도메인 import 금지 (adapter 구현에서만)
3. Domain → 다른 레이어 import 금지 (domain은 잎)
4. 도메인 간 내부 파일 직접 import 금지 (모듈 exports 우회 금지)

규칙 상세는 `eslint.config.mjs`의 `boundaries/elements`·`boundaries/dependencies`를, 개념은 [layer-architecture](../architecture/layer-architecture.md)를 참고.
