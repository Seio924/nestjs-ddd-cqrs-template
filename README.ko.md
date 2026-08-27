[English](./README.md) · 한국어

# nestjs-ddd-cqrs-template

> NestJS + TypeORM으로 **Rich Domain 4-Layer · CQRS · 봉투 응답**을 미리 깔아둔 백엔드 스타터 템플릿.
> 마이크로서비스 없이 **모놀리스 + 단일 DB**로 가되, 도메인 경계와 계층 규칙은 지키고 싶은 팀을 위한 것.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803)

GitHub 상단 **"Use this template"** 버튼으로 새 프로젝트를 바로 시작하세요.

---

## 왜 이 템플릿인가

대부분의 스타터는 폴더만 나눠두거나, 반대로 마이크로서비스를 전제로 무겁습니다. 이 템플릿은 그 사이를 노립니다.

- **모놀리스에 맞는 DDD** — 서비스로 쪼개지 않고도 도메인마다 4계층으로 경계를 긋습니다.
- **규칙을 문서가 아니라 빌드로 강제** — 레이어/도메인 침범을 `eslint-plugin-boundaries`가 막아, 시간이 지나도 구조가 안 무너집니다.
- **읽기/쓰기 분리(CQRS)** — 쓰기는 애그리거트(규칙)로, 읽기는 화면 모양대로 조회로. 섞이지 않습니다.
- **바로 얹는 횡단 관심사** — 봉투 응답·전역 예외 필터·인증 가드·Swagger·보안·로깅·CI가 이미 배선돼 있습니다.
- **동작하는 샘플 + 규칙 문서** — `article` 도메인 하나로 패턴을 보여주고, `.claude/`에 설계 기준이 정리돼 있습니다.

## 누구에게 맞나

- 마이크로서비스를 도입할 규모/이유는 없지만 **도메인 경계는 지키고 싶은** 팀·개인
- NestJS에서 **DDD(Rich Domain) + CQRS**를 실무 구조로 시작하려는 사람
- "폴더 컨벤션"이 아니라 **강제되는 경계 + 문서화된 규칙**을 원하는 사람

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

## 아키텍처 한눈에

의존은 항상 **domain을 향합니다**(domain은 순수). infrastructure만 의존 역전으로 domain을 구현합니다.

```
Interface   →   Application   →    Domain    ←   Infrastructure
(controller)   (command/query)  (애그리거트·포트)  (repository·query 구현)
```

한 도메인 = 4계층 한 벌:

```
<domain>/
  interface/       HTTP 입구 (controller, DTO)
  application/     유스케이스 배선 (command/query service, 포트, DTO)
  domain/          순수 규칙 (애그리거트, repository 포트)
  infrastructure/  바깥세상 구현 (repository·query·entity·매퍼)
```

- **쓰기**: controller → command service → 애그리거트(규칙) → repository → DB
- **읽기**: controller → query service → query 포트 → DB (애그리거트 안 거침, DTO로 직행)

## 시작하기

```bash
pnpm install
cp .env.example .env      # 값 채우기 (DATABASE_URL 등)
pnpm start:dev
# API 문서: http://localhost:4000/docs
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm start:dev` | 워치 모드 실행 |
| `pnpm lint` / `pnpm test` / `pnpm build` | CI와 동일 |
| `pnpm migration:run` / `pnpm migration:revert` | TypeORM 마이그레이션 |

## 구조

```
src/
  common/     봉투·필터·가드·Swagger 래퍼·validation·logging·security (공유)
  config/     환경변수 검증 (fail-fast)
  database/   TypeORM DataSource + 마이그레이션
  <domain>/   도메인마다 4계층 (interface / application / domain / infrastructure)
```

## 새 도메인 추가하는 법

샘플 도메인(`src/article`)을 복제해 이름만 바꾸고 규칙을 채운 뒤, `app-module.ts`에 모듈을 등록하세요. 패턴을 다 익혔으면 `article`을 지우면 됩니다.

## 문서

아키텍처·컨벤션의 전체 기준은 [`CLAUDE.md`](./CLAUDE.md)(인덱스)와 `.claude/` 폴더에 있습니다.

- **아키텍처** `.claude/architecture/` — 설계 원칙·레이어·모듈·DDD·CQRS·리포지토리·에러·ID·페이지네이션
- **컨벤션** `.claude/conventions/` — 네이밍·코드 스타일·Nest·테스트·강제·Git
- **파운데이션** `.claude/foundation/` — 개요·API 계약·인증·로깅/보안·설정·Swagger·CI

## 라이선스

[MIT](./LICENSE) © Seio924
