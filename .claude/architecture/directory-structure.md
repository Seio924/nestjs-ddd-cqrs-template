# 디렉토리 구조

> 파일을 실제로 어디에 놓는지 정의한다. 개념은 [design-principles.md](./design-principles.md) 참고.
> 예시 도메인은 이 템플릿의 샘플 도메인 `article` 기준이다.

---

## 1. 최상위 `src/` 구조

```
src/
  common/                    # 공유 유틸 (interceptor, filter, guard, decorator 등)
  database/                  # 공유 DB 설정 (TypeORM DataSource 등)
  config/                    # 환경·관심사별 config
  <domain>/                  # 도메인 모듈 (컨텍스트마다 4계층 반복)
```

> ⚠️ `outbox/`, `task-queue/`(@Global 공유 모듈) 폴더는 두지 않는다.
> 이유: 단일 DB라 쓰기 교차를 동기 트랜잭션으로 처리하므로 Outbox/SQS가 불필요하다. (design-principles §4)

---

## 2. 도메인 모듈 구조 (4계층)

`article` 도메인을 예시로 (각 파일이 어떤 개념인지 주석). 일부(adapter/·event/·service/·scheduler/·값 객체·도메인 이벤트)는 **필요할 때만** 두는 선택 요소다 — 샘플은 그 부분집합만 쓴다.

```
article/
  domain/                              # 순수 규칙 (DB·프레임워크 모름)
    article.ts                         # 애그리거트 루트 (엔티티, 규칙 보유)
    article-title.ts                   # 값 객체(Value Object)
    article-published.ts               # 도메인 이벤트 (선택)
    article-repository.ts              # repository 포트(interface)

  application/                         # 유스케이스 배선
    command/
      article-command-service.ts       # 쓰기 유스케이스 (오케스트레이션도 여기)
      dto/                             # command 입력/출력 데이터 타입 (서비스와 분리)
        <verb>-<noun>-command.ts       # 커맨드 객체 (입력)
    query/
      article-query-service.ts         # 읽기 (엔티티 안 거침)
      article-query.ts                 # 쿼리 포트(interface) — 포트는 DTO 아님, dto/에 안 넣음
      dto/                             # query 입력/출력 데이터 타입
        <verb>-<noun>-query.ts         # 쿼리 객체 (입력)
        <verb>-<noun>-result.ts        # 쿼리 결과 DTO (출력)
    adapter/                           # 남의 도메인 포트(문) — 교차 도메인 있을 때만
      <external>-adapter.ts
    service/                           # 기술 서비스 포트 — 필요 시
      <concern>-service.ts
    event/                             # 이벤트 핸들러(부수효과) — 필요 시
      article-published-handler.ts

  interface/                           # HTTP 입구
    article-controller.ts              # 컨트롤러
    article-controller-docs.ts         # 스웨거 데코레이터 (컨트롤러 옆, 여러 개면 docs/)
    dto/
      create-article-request-body.ts   # 요청 body
      <verb>-<noun>-request-param.ts
      <verb>-<noun>-request-query.ts
      <verb>-<noun>-response-body.ts   # 응답 body

  infrastructure/                      # 바깥세상 (외부 라이브러리는 여기만!)
    entity/
      article.entity.ts                # TypeORM 엔티티 (DB 테이블 매핑)
    repository/
      article-repository-impl.ts       # repository 포트 구현 + 매퍼
    query/
      article-query-impl.ts            # 쿼리 포트 구현
    adapter/                           # 남의 도메인 어댑터 구현 — 필요 시
      <external>-adapter-impl.ts
    service/                           # 기술 서비스 구현 — 필요 시
      <concern>-service-impl.ts
    scheduler/                         # 크론/스케줄러 — 필요 시
      <concern>-scheduler.ts

  article-module.ts                    # NestJS 모듈 (DI 배선)
  article-error-message.ts             # 에러 메시지 모음
  article-error-code.ts                # 에러 코드 모음 (<DOMAIN>_<REASON>)
  article-enum.ts                      # enum 모음
  article-constant.ts                  # 상수 모음 (필요 시)
```

---

## 3. 배치 규칙 (🔴 핵심)

| 종류 | 포트/정의 위치 | 구현 위치 |
|---|---|---|
| **Repository** | `domain/<aggregate>-repository.ts` | `infrastructure/repository/<aggregate>-repository-impl.ts` |
| **Query** | `application/query/<domain>-query.ts` | `infrastructure/query/<domain>-query-impl.ts` |
| **Adapter** (남의 도메인) | `application/adapter/<external>-adapter.ts` | `infrastructure/adapter/<external>-adapter-impl.ts` |
| **기술 서비스** | `application/service/<concern>-service.ts` | `infrastructure/service/<concern>-service-impl.ts` |

**공통 원칙:**
- **포트(약속)는 도메인/애플리케이션에, 구현은 무조건 infra.**
- **infra도 application처럼 역할별 하위 폴더**(repository/·query/·adapter/·service/)로 나눈다. infra는 구현이 모이는 가장 붐비는 레이어라 역할별 폴더가 필요하고, application(command/·query/·adapter/)과 대칭이 맞는다.
- **TypeORM 엔티티는 `infrastructure/entity/`.** (도메인 엔티티 `article.ts`와 별개 파일 — 매퍼가 변환)
- **외부 라이브러리(TypeORM·axios·SDK)를 import하는 파일은 무조건 infra.**

### application DTO 배치·네이밍

command/query **서비스**와 그 **입력/출력 데이터 타입**을 섞지 않는다. 데이터 타입은 각 side의 **`dto/` 하위 폴더**로 분리한다(interface/dto/와 같은 패턴, CQRS 분리 유지).

- `application/command/dto/` — command 입력(커맨드 객체)·출력 데이터 타입
- `application/query/dto/` — query 입력(쿼리 객체)·출력(result) 데이터 타입
- **포트는 DTO가 아니다** — `query.ts`(쿼리 포트)·`adapter.ts`(어댑터 포트)·`service.ts`(기술 서비스 포트)는 dto/에 넣지 않고 자기 자리에 둔다.

**네이밍 규칙** — 파일명을 가르는 기준은 "command/query"가 아니라 **"공유 값이냐 / 특정 유스케이스 전용이냐"**:

| 종류 | 네이밍 | 예 |
|---|---|---|
| 입력 (쓰기) | `<verb>-<noun>-command.ts` | `publish-article-command.ts` |
| 입력 (읽기) | `<verb>-<noun>-query.ts` | `search-articles-query.ts` |
| 특정 유스케이스 출력 | `<verb>-<noun>-result.ts` | `get-article-detail-result.ts` |
| 여러 유스케이스가 공유하는 값 | 서술형 이름 | `article-summary.ts` |

> `article-summary`가 `-result`가 아닌 건, 한 유스케이스의 "결과"가 아니라 여러 쿼리가 **공유하는 값**이기 때문.

---

## 4. 두 종류의 "엔티티" (헷갈림 주의)

| | `domain/article.ts` | `infrastructure/entity/article.entity.ts` |
|---|---|---|
| 정체 | **도메인 엔티티** (순수 규칙, `article.publish()`) | **TypeORM 엔티티** (DB 테이블, `@Entity`·`@Column`) |
| 의존 | 아무것도 모름 (순수 TS) | TypeORM |
| 변환 | ← `article-repository-impl.ts`의 **매퍼**가 둘 사이를 변환 → | |

이 매퍼가 "TypeORM을 써도 도메인은 순수 유지"의 비용(세금)이다.

---

## 5. enum/constant/error 파일 규칙

- **인라인 금지.** enum·상수는 별도 파일에 모아 **도메인 루트**에 둔다.
  - `article-enum.ts` — 이 도메인의 모든 enum
  - `article-constant.ts` — 이 도메인의 모든 상수 (`UPPER_SNAKE_CASE`)
  - `article-error-message.ts` / `article-error-code.ts` — 에러 메시지/코드 (1:1)

---

## 6. 공유 모듈 규칙

- **다른 도메인이 실제로 공유할 때만** 최상위(`common/` 등)로 추출한다.
- 성급하게 공유 폴더로 빼지 않는다. 한 도메인만 쓰면 그 도메인 안에 둔다.

---

## 7. 파일 네이밍

- **kebab-case + 역할 접미사.** `.module.ts`가 아니라 `-module.ts` 형식.
  - `article-module.ts`, `article-controller.ts`, `article-command-service.ts`, `article-repository-impl.ts`
- Nest 프리미티브(`.guard.ts`·`.filter.ts`·`.interceptor.ts`·`.pipe.ts`·`.decorator.ts`·`.spec.ts`·`.entity.ts`)만 점(.) 접미사 유지. 상세는 [conventions/naming](../conventions/naming.md).
