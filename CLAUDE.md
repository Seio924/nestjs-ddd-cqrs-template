# nestjs-ddd-cqrs-template

NestJS + TypeORM 백엔드 스타터. **Rich Domain 4-Layer + CQRS(읽기/쓰기 분리) + 봉투 응답**.

이 파일은 아키텍처·컨벤션 문서의 인덱스다. 상세 기준은 아래 `.claude/` 문서들이며, `src/article`이 그 원칙을 그대로 구현한 **샘플 도메인**이다(복제해서 새 도메인을 만든다).

## 문서 구조

### 🏛 아키텍처 (기준)
@.claude/architecture/design-principles.md
@.claude/architecture/directory-structure.md
@.claude/architecture/layer-architecture.md
@.claude/architecture/module-pattern.md
@.claude/architecture/tactical-ddd.md
@.claude/architecture/error-handling.md
@.claude/architecture/repository-pattern.md
@.claude/architecture/cqrs-pattern.md
@.claude/architecture/aggregate-id.md
@.claude/architecture/pagination.md

### 코드 컨벤션
@.claude/conventions/architecture.md
@.claude/conventions/nest.md
@.claude/conventions/code-style.md
@.claude/conventions/naming.md
@.claude/conventions/testing.md
@.claude/conventions/enforcement.md
@.claude/conventions/git.md

### 파운데이션 스펙
@.claude/foundation/overview.md
@.claude/foundation/api-contract.md
@.claude/foundation/auth.md
@.claude/foundation/observability.md
@.claude/foundation/config-and-data.md
@.claude/foundation/api-docs.md
@.claude/foundation/testing-ci.md

## 핵심 결정 요약

- 스택: NestJS + **TypeORM** + TypeScript(strict), **Rich Domain 4-Layer**(interface/application/domain/infrastructure)
- 규칙 위치: **엔티티**=도메인 규칙(if·불변식) / **command service**=배선(로드·저장·트랜잭션) / **infra**=외부 라이브러리(TypeORM 등)
- 포트: **interface + InjectionToken**, 어댑터 구현은 infra
- CQRS: **폴더 분리 O / CommandBus 보류** (Query는 Repository 안 씀, 별도 읽기 통로)
- 교차 도메인: **남의 도메인 = adapter**(읽기·쓰기 전부) / 쓰기 원자적 교차는 **동기 트랜잭션**(`@Transactional`) / 부수효과는 이벤트(EventEmitter)
- 순환: **설계로 막음**(주인=URL 첫 세그먼트, 한 방향) — forwardRef 금지
- 에러: 엔티티가 도메인 예외 throw(HTTP 모름) → 전역 필터가 봉투로 변환. 코드 `<DOMAIN>_<REASON>`
- 응답: `{ code, message, result }` 봉투
- ID: 도메인이 `create()` 시점에 생성(`common/generate-id.ts`, 기본 UUID v4)
- 인증: 전역 `JwtAuthGuard` + `@Public()` + `@CurrentUser()` (검증 골격 — 발급은 프로젝트에서)
- 네이밍: 도메인/앱/인프라 역할 파일은 **하이픈**(`-module.ts` 등), Nest 프리미티브만 점(`.guard.ts`·`.entity.ts` 등)
- 페이지네이션: 오프셋(관리자·검색) + 커서(피드·무한스크롤) 병행
- Git: main + feature PR → **Squash merge**. 커밋 `type(scope): 요약`. **1 PR = 1 논리 변경**(작게)
- 경계 강제: `eslint.config.mjs`의 boundaries 규칙이 레이어/도메인 침범 시 빌드 실패

## 샘플 도메인 (src/article)

`article`이 4계층·CQRS·포트/어댑터·매퍼·마이그레이션·테스트를 한 수직 슬라이스로 시연한다. 새 도메인은 이걸 복제해 시작하고, 다 익혔으면 `article`을 지운다.
