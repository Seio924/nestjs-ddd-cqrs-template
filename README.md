# nestjs-ddd-cqrs-template

NestJS + TypeORM 백엔드 스타터. **Rich Domain 4-Layer + CQRS(읽기/쓰기 분리) + 봉투 응답**을 기본으로 깔아둔 템플릿.

> GitHub에서 **"Use this template"** 버튼으로 새 프로젝트를 시작하세요.

## 스택

- NestJS 11 · TypeScript(strict) · TypeORM 0.3(MySQL)
- 검증 class-validator · 로깅 nestjs-pino · 문서 @nestjs/swagger
- 트랜잭션 `@Transactional()`(typeorm-transactional) · 테스트 Jest

## 무엇이 들어있나

- **봉투 응답** `{ code, message, result }` (전역 인터셉터 + 예외 필터)
- **도메인 예외 → HTTP 자동 변환** (BaseException + 전역 필터)
- **전역 인증 가드** (JwtAuthGuard + `@Public()` + `@CurrentUser()`) — 토큰 검증까지, 로그인/발급은 프로젝트에서 구현
- **Swagger** 봉투 제네릭 래퍼(`ApiResult`/`ApiResultList`) + 도메인 예외 자동 문서화(`ApiErrors`)
- **보안** helmet + CORS(WEB_ORIGIN만) + rate limit
- **아키텍처 경계 린트**(eslint-plugin-boundaries) — 레이어/도메인 침범 시 빌드 실패
- **CI**(lint + test + build)

## 시작하기

```bash
pnpm install
cp .env.example .env      # 값 채우기
pnpm start:dev
# 문서: http://localhost:4000/docs
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm start:dev` | 워치 모드 실행 |
| `pnpm lint` / `pnpm test` / `pnpm build` | CI와 동일 |
| `pnpm migration:run` / `migration:revert` | TypeORM 마이그레이션 |

## 구조

```
src/
  common/     봉투·필터·가드·Swagger 래퍼·validation·logging·security (공유)
  config/     환경변수 검증(fail-fast)
  database/   TypeORM DataSource + 마이그레이션
  <domain>/   도메인마다 4계층 (interface / application / domain / infrastructure)
```

## 새 도메인 추가하는 법

샘플 도메인(`src/article`)을 복제해 이름만 바꾸고 규칙을 채운 뒤, `app-module.ts`에 모듈을 등록하세요. 다 익혔으면 `article`을 지우면 됩니다.

## 문서

아키텍처·컨벤션의 전체 기준은 [`CLAUDE.md`](./CLAUDE.md)(인덱스)와 `.claude/` 폴더에 있습니다.

- **아키텍처** `.claude/architecture/` — 설계 원칙·레이어·모듈·DDD·CQRS·리포지토리·에러·ID·페이지네이션
- **컨벤션** `.claude/conventions/` — 네이밍·코드 스타일·Nest·테스트·강제·Git
- **파운데이션** `.claude/foundation/` — 개요·API 계약·인증·로깅/보안·설정·Swagger·CI

> `CLAUDE.md`는 Claude Code가 이 문서들을 자동으로 참조하도록 인덱싱합니다.
