# 설계 원칙 (Rich Domain 4-Layer)

> 이 문서는 이 템플릿의 **아키텍처 핵심 원칙**이다.
> 전제: **단일 앱 + 단일 DB**. 이 전제가 여러 결정(예: Outbox/SQS 미도입)의 근거가 된다. 여러 앱으로 쪼개거나 분산 트랜잭션이 필요해지면 그때 재검토한다.

---

## 1. 스택 & 큰 그림

- **NestJS + TypeORM + TypeScript**
- **Rich Domain 4-Layer** (컨텍스트별로 4개 레이어)

```
src/<도메인>/
  interface/        HTTP 입구 (controller)
  application/      유스케이스 배선 (command/query service, adapter 포트)
  domain/           순수 규칙 (엔티티, domain service, repository 포트)
  infrastructure/   바깥세상 구현 (repository 구현, 매퍼, adapter 구현, 외부연동)
```

---

## 2. 4개 레이어의 역할 (🔴 핵심)

| 조각 | 하는 일 | DB 만짐? | 레이어 |
|---|---|---|---|
| **엔티티** (`Article`) | **규칙** (`if`·계산·불변식). 상태는 private, 규칙 메서드로만 변경 | ❌ | domain |
| **domain service** | **여러 엔티티에 걸친 "주인 없는" 규칙** (송금·교환류). **가끔만** 존재 | ❌ | domain |
| **command service** | 유스케이스 **배선** (불러오기·저장·순서·트랜잭션) | ✅ | application |
| **query service** | **읽기** 전용 조회 (엔티티 안 거치고 화면 모양대로) | ✅(읽기) | application |
| **controller** | HTTP 받고 응답 변환. 로직 없음 | — | interface |
| **repository 구현** | 실제 DB 쿼리 + 엔티티↔DB 매퍼 | ✅ | infra |

### 판별법 (레이어 헷갈릴 때)
- `if`·계산·도메인 규칙이 있으면 → 엔티티(domain). command에 도메인 규칙(`if`)을 쓰지 마라.
  - 예외: "불러왔는데 없으면 예외" 같은 **배선 가드**는 command에 OK. (데이터 유무 판단 ≠ 도메인 규칙)
- **repository·DB를 만지면 → command service(application).**
- **외부 라이브러리(TypeORM, axios, S3 SDK 등)를 import하는 파일 → 무조건 infra.**

### 왜 이렇게 나누나 — 서비스 비대 해소
기존(anemic) 방식은 규칙 + 배선이 한 서비스에 뭉쳐 서비스가 비대해진다.
Rich domain은 **규칙을 엔티티로 내려** 서비스를 얇게 만든다.
- 규칙(`if 발행됐으면 수정 불가`) → 엔티티(`article.edit()`)
- 배선(로드·저장) → command service

### command → 엔티티 직접 호출이 기본
`command → domain service → 엔티티`가 **항상은 아니다.** 대부분 `command → 엔티티` 직접이다.
domain service는 **여러 엔티티에 걸친, 주인 없는 규칙**일 때만 낀다.
- 주인이 명확 → 그 엔티티 메서드 (예: `article.publish()`)
- 주인 없는 중립 규칙 → domain service (예: `remit(from, to)`, `swap(itemA, itemB)`)

---

## 3. 포트 & 어댑터

- **포트 = 인터페이스(약속), 어댑터 = 구현.** 포트는 "무엇을 할 수 있다"만, 어댑터가 "어떻게"를 구현.
- **포트는 `interface` + `InjectionToken`으로 정의**(업계 보편 방식).
  - `interface`는 런타임에 사라져 NestJS DI가 못 찾으므로, 문자열 토큰(`InjectionToken`)으로 배선하고 `@Inject(TOKEN)`으로 주입한다.
  - 배선: `providers: [{ provide: TOKEN, useClass: XxxImpl }]`
- **repository 포트**는 domain에, **구현(`...Impl`)은 infra**에.
- 어댑터의 목적은 **의존 "제거"가 아니라 "격리"**:
  1. 교차 도메인 호출의 **통로**
  2. 남의 변경 충격을 **한 파일(어댑터 구현)에 격리** → 유지보수
  3. 추상에 의존 → **의존 방향 선택 가능**(DIP)

---

## 4. 교차 도메인 (🔴 가장 많이 논의하는 것)

### 기본 규칙
```
내 도메인   → 직접 (query로 읽고, command로 씀)
남의 도메인 → 무조건 adapter 문 (읽기·쓰기 전부)
```
기준은 "읽기/쓰기"가 아니라 **"내 도메인 / 남의 도메인"**이다.
남의 도메인은 그 도메인이 `exports`한 것(읽기 Query 등)만 어댑터로 부른다. 남의 repository·내부는 절대 만지지 않는다(ACL, 부패 방지 계층).

### 주인 도메인 = URL 첫 세그먼트
- `POST /articles` → 주인은 **article**.
- 여러 도메인을 조율하는 **오케스트레이션은 주인 도메인의 command service** 안에서 한다. (별도 상위 계층 안 만듦)
- **"오케스트레이션"은 별도 장치가 아니다.** 남의 도메인 adapter를 여러 개 두드리는 command service가 곧 오케스트레이션이다.

```ts
// article/application/command/publish-article-command-service.ts
async publishArticle(articleId: string) {
  await this.txManager.run(async () => {           // 한 트랜잭션 = 원자성
    const article = await this.articleRepo.findById(articleId);  // 내 도메인 (직접)
    article.publish();
    await this.articleRepo.save(article);
    await this.pointAdapter.grant(article.authorId);  // 남의 도메인 (adapter)
    await this.statAdapter.increment(article.authorId); // 남의 도메인 (adapter)
  });
}
```
> `point`·`stat`은 교차 도메인을 설명하기 위한 예시 이웃 도메인이다(샘플 코드엔 없음).

### 쓰기 교차: 동기 트랜잭션
- 쓰기 교차는 **동기 트랜잭션 하나**로 처리한다. 원자적 쓰기를 한 트랜잭션에 묶어 **진짜 원자성**을 얻는다.
- **Outbox/SQS 미도입.** 이유: 단일 DB라 비동기 최종 일관성 없이 동기 트랜잭션으로 원자성을 확보할 수 있다. (나중에 마이크로서비스로 쪼갤 때 승격)

### 부수효과: 이벤트
- 알림·푸시·통계처럼 **원자성 불필요 + 실패해도 핵심 흐름 롤백 안 되는** 것은 **이벤트**로.
- Nest **EventEmitter**로 시작. (유실 방지가 중요해지면 그때 Outbox 고려)

### 격리·순환·원자성은 서로 다른 문제 (헷갈리지 말 것)
| 문제 | 무엇? | 해결책 |
|---|---|---|
| **격리** | "남이 바뀌면 내가 흔들린다" | **adapter** (유지보수·내부숨김·방향선택) |
| **순환** | "A↔B 서로 물림" | **설계** (아래) — adapter가 막는 게 아님 |
| **원자성** | "다 되거나 다 안 되거나" | **동기 트랜잭션** (Outbox/SQS 대신) |

우리 선택(adapter 동기)은 **코드 격리는 유지**하고 **시간 격리(비동기)만 포기**한다. 단일 앱이라 시간 격리가 불필요하고 원자성이 더 중요하므로 정답이다.

---

## 5. 순환 방지 (설계로 막는다)

- **domain 레이어(엔티티)는 다른 도메인을 모른다 = "잎(leaf)".** 참조는 있어도 infra의 어댑터 구현 끄트머리에만.
- **adapter는 순환을 자동으로 막지 않는다.** A가 B를, B가 A를 서로 adapter로 부르면 여전히 순환이다.
- 순환은 **설계로** 막는다:
  1. **유스케이스마다 주인 하나 + 참조는 한 방향만.**
  2. 순환이 생기면 **"책임이 잘못 놓인 것 아닌가"를 먼저 의심**하고 자리를 옮긴다. (대부분 이걸로 해결)
  3. 진짜 양방향이 필요하면 **한쪽을 이벤트로 끊는다.** (최후 수단, `forwardRef` 아님)

---

## 6. CQRS

- **폴더 분리(command/query)는 채택 O.** **CommandBus(유스케이스마다 Command+Handler 클래스 + 버스)는 보류.**
  - command service에 메서드로 둔다(가벼운 버전). 필요하면 특정 도메인만 나중에 CommandBus 도입.
- **왜 CQRS인가:** rich domain(엔티티·불변식)은 **쓰기에만** 필요하다. 읽기(목록·리포트 조회)는 엔티티를 거치면 오히려 N+1·낭비 → **query는 엔티티 무시하고 화면 모양대로 최적화 쿼리**.

```
application/
  command/   쓰기 (엔티티 거침, 규칙·트랜잭션)
  query/     읽기 (엔티티 안 거침, 최적화 쿼리)
  adapter/   남의 도메인 포트
```

---

## 7. 에러 처리

- 엔티티가 도메인 예외를 `throw` 한다 (`return` 아님). 규칙 위반 시 흐름을 멈춰야 하므로.
- 도메인 예외는 **HTTP를 모른다** (`ArticleNotEditableException` O, Nest `BadRequestException` ✗).
- 흐름: **엔티티 throw → command는 안 잡고 통과 → 전역 예외 필터가 HTTP로 변환.**
- "상한 제한(100 넘으면 100)" 같은 건 예외가 아니라 그냥 규칙대로 처리(`Math.min`).

---

## 8. API 응답 형식

- 봉투(envelope) 방식: `{ code, message, result }` (성공·실패 동일 껍데기).
  ```jsonc
  // 성공 (200)
  { "code": "SUCCESS", "message": "...", "result": { ... } }
  // 실패 (404)
  { "code": "ARTICLE_NOT_FOUND", "message": "...", "result": null }
  ```
- 에러 코드 형식: `<DOMAIN>_<REASON>` UPPER_SNAKE (예: `ARTICLE_NOT_FOUND`).
- HTTP 상태코드도 정직하게 준다(200/201/204/4xx/5xx). 프론트는 `code`로 분기(메시지 텍스트 의존 금지).
- 봉투 벗기기·에러 정규화는 **프론트의 http 클라이언트 한 곳**에서 흡수한다.

> 봉투는 자체 프론트 전용 API에서 실용적이다(에러 분기 일관, 타입 생성 편함). 공개 REST API라면 순수 REST를 고려.

---

## 9. 확정 요약 (한 장)

| 항목 | 결정 |
|---|---|
| ORM | TypeORM |
| 아키텍처 | Rich Domain 4-Layer (컨텍스트별) |
| 포트 정의 | interface + InjectionToken |
| CQRS | 폴더 분리 O / CommandBus 보류 |
| 교차 도메인 | 남의 도메인 = adapter (읽기·쓰기 전부) |
| 쓰기 교차 | 동기 트랜잭션 (Outbox/SQS 미도입) |
| 부수효과 | 이벤트 (EventEmitter) |
| 순환 | 설계로 막음 (주인 하나 + 한 방향) |
| 에러 | 엔티티 throw → 전역 필터 변환, 도메인 예외는 HTTP 모름 |
| 응답 형식 | `{ code, message, result }` |
| repository 조회 | `findById` 등 허용 (단일 find 강제 안 함) |
