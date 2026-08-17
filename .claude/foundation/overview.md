# 개요 & 프로젝트 뼈대

이 문서는 **기능 도메인과 무관하게 안 바뀌는 기반**(횡단 관심사 + 인증 골격)의 스펙이다.
코드 규칙은 [코드 컨벤션](../conventions/architecture.md)을 따르고, 이 문서는 "무엇을 어떻게 세팅하는가"를 정한다.

---

## 스택 & 버전

| 항목 | 선택 |
|---|---|
| 런타임 | Node 22 LTS |
| 패키지 매니저 | pnpm |
| 프레임워크 | NestJS 11 |
| 언어 | TypeScript 5.x (`strict`) |
| ORM | **TypeORM** (MySQL) |
| 검증 | class-validator + class-transformer |
| 인증 | `@nestjs/jwt` + Passport(JWT 전략) — 검증 골격 (발급은 프로젝트에서) |
| 로깅 | nestjs-pino |
| 문서 | @nestjs/swagger |
| 테스트 | Jest + Supertest |
| 트랜잭션 | typeorm-transactional (`@Transactional()`) |

---

## 폴더 구조

```
src/
  main.ts                     # 부트스트랩(전역 파이프·필터·인터셉터·swagger·security)
  app-module.ts
  common/                     # 봉투 인터셉터·예외 필터·BaseException·전역 가드·데코레이터·pipe·logging·security·swagger
  config/                     # 환경변수 검증(fail-fast)
  database/                   # TypeORM DataSource + 마이그레이션
  <domain>/                   # 도메인별 4계층(interface/application/domain/infrastructure)
    article/                  # 샘플 도메인
```

> 도메인 내부 4계층 상세·네이밍은 [directory-structure](../architecture/directory-structure.md) 기준.

---

## 부트스트랩 순서

1. 앱 생성 + config/env 검증 + TypeORM DataSource + `initializeTransactionalContext()`
2. 횡단: ResponseInterceptor · AllExceptionsFilter · BaseException · ValidationPipe · pino · helmet/CORS/throttler
3. 인증: 전역 JwtAuthGuard + `@Public`/`@CurrentUser` (토큰 검증 골격 — 로그인/발급은 프로젝트에서 구현)
4. 도메인 모듈 추가 (`article` 샘플 참고)
5. Swagger `/docs` 노출

---

## 확장 시 채우는 것

- 인증 발급 흐름(로그인·refresh·소셜) — 프로젝트 요구에 맞게 구현
- 기능 도메인 — `article` 샘플을 복제해 추가
- 배포 인프라 — 프로젝트별
