# 테스트 & CI

## 테스트 ([코드 컨벤션 §테스트](../conventions/testing.md))

- 도메인 애그리거트 단위 테스트(규칙·불변식) + Service 단위 테스트(repository mock)가 주력.
- 복잡한 쿼리만 Repository 통합 테스트(테스트 DB), 핵심 흐름만 e2e(Supertest).
- 파일: 대상과 같은 폴더 `*.spec.ts`. e2e는 `test/`의 `*.e2e-spec.ts`.
- 파운데이션 자체 검증(응답 래핑·예외 필터·전역 가드 `@Public` 동작)은 통합 스펙으로 둔다(샘플의 `common/api-contract.spec.ts` 참고).

---

## CI ([코드 컨벤션 §강제 방법](../conventions/enforcement.md))

- PR 시 `lint + test + build`. 실패 시 머지 불가.
- 아키텍처 경계 린트(eslint-plugin-boundaries)가 레이어/도메인 침범을 막는다.
