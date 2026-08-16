# 레이어 아키텍처 (의존 방향)

> "누가 누구를 부를 수 있나"를 정의한다. 파일 배치는 [directory-structure.md](./directory-structure.md), 개념은 [design-principles.md](./design-principles.md) 참고.

---

## 1. 의존 방향 — 핵심 그림

```
Interface  →  Application  →  Domain  ←  Infrastructure
(controller)  (command/query)  (엔티티·포트)  (repository 구현)
```

- **모든 화살표가 Domain을 향한다.** Domain은 화살표를 **받기만 하고 보내지 않는다**(= 잎/leaf, 왕).
- **Infrastructure만 화살표가 거꾸로**(위로) 올라간다 = **의존 역전(DIP)**.

화살표 = "누가 누구를 import 하느냐". Infra가 domain의 포트를 import해서 구현하므로 `infra → domain`이다.

---

## 2. 각 레이어 책임

| 레이어 | 책임 | 하지 않는 것 |
|---|---|---|
| **Interface** (controller) | 요청 수신, application 호출, 응답 변환 | 비즈니스 로직, DB 접근, repository 직접 호출 |
| **Application** (command/query service) | 유스케이스 배선(로드·저장·순서·트랜잭션), 조율 | 도메인 규칙(`if`), HTTP 관심사 |
| **Domain** (엔티티, 포트) | 순수 규칙(불변식·계산), 포트 정의 | 프레임워크·ORM·다른 레이어 의존 |
| **Infrastructure** (구현) | 포트 구현, ORM 접근, 외부연동, 매퍼 | 비즈니스 판단 |

---

## 3. 의존 역전 (왜 infra만 화살표가 거꾸로인가)

상식적으론 `Application → Infrastructure`(서비스가 DB를 쓰니까)일 것 같지만 **반대다**:

```
Application → Domain ← Infrastructure   (둘 다 domain을 향함)
```

이유: **포트는 domain이 소유하고, infra가 그것을 구현**한다.

```ts
// domain/article-repository.ts  ← domain이 "약속"을 정의 (포트)
export interface ArticleRepository {
  save(article: Article): Promise<void>;
}
export const ARTICLE_REPOSITORY = 'ArticleRepository';   // InjectionToken

// infrastructure/repository/article-repository-impl.ts  ← infra가 domain의 약속을 '따름'
@Injectable()
export class ArticleRepositoryImpl implements ArticleRepository {  // ← domain을 import!
  async save(article: Article): Promise<void> { /* TypeORM */ }
}

// module에서 배선
{ provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl }
```

→ infra가 domain을 import하므로 `infra → domain`. **domain은 infra를 전혀 모른다.**
결과: TypeORM을 바꿔도 domain은 안 바뀌고, infra만 domain에 맞춰 다시 구현한다.

> ⚠️ 포트는 `interface` + `InjectionToken`으로 정의한다. (design-principles 참고)

---

## 4. 포트의 위치 규칙 (🔴 자주 헷갈림)

포트(interface)는 domain과 application에 **나뉘어** 있는데, 이는 흩어진 게 아니라 **"그 약속을 소유한(필요로 하는) 레이어"**에 정확히 배치된 것이다.

| 포트 | 위치 | 소유 근거 |
|---|---|---|
| **repository 포트** | **domain** | 도메인 개념의 본질적 필요 ("Article을 저장할 수단이 필요") |
| **adapter 포트** (남의 도메인) | **application** | 특정 유스케이스의 사정 ("이 유스케이스가 포인트가 필요") |
| **query 포트** | **application** | 유스케이스의 읽기 필요 |

**리트머스:**
- "이 약속이 없으면 **도메인 개념 자체가 성립 안 하나?**" → domain (repository)
- "이 약속은 **특정 유스케이스 때문에** 필요한가?" → application (adapter, query)

**왜 이렇게 나뉘어야만 하나 (화살표 규칙의 필연):**
adapter 포트를 domain에 두면 → domain이 남의 도메인을 알게 됨 → 순수성(잎) 깨짐. ❌
adapter 포트를 application에 두면 → domain은 모름, application만 남을 앎 → domain 순수 유지. ✅

**공통 원칙:** 포트는 "필요를 느끼는 레이어"에, **구현(-impl)은 포트 위치와 무관하게 전부 infra**로 내려간다.

---

## 5. 금지 조합 (전부 "화살표 거스르기")

| 🔴 금지 | 위반하는 것 |
|---|---|
| domain이 application/infrastructure/interface를 import | domain은 화살표를 보내면 안 됨 (잎 깨짐) |
| domain에 `@Injectable`·`@Module` 등 Nest 데코레이터 | domain이 프레임워크(밖)에 의존 |
| controller가 repository 구현을 직접 import | interface→infra 직통 금지, 반드시 application 경유 |
| 애그리거트에 public setter (`article.status = x`) | 상태는 규칙 메서드로만 변경 (불변식 우회 차단) |
| command service에 도메인 규칙(`if 조건`) | 규칙은 엔티티로 (배선 가드는 예외) |

---

## 6. 교차 도메인 화살표

교차 도메인 참조에는 adapter를 쓴다. repository와 동일 패턴이다:

```
Application → Adapter포트(application) ← AdapterImpl(infra) → 남의 도메인 exports
```

- adapter 포트 = application, 구현 = infra.
- **남의 도메인을 import하는 곳은 오직 infra의 adapter 구현 끄트머리**뿐 → 그래서 도메인 본체엔 순환이 안 생긴다(design-principles §5).

---

## 7. 한 줄 요약

> 모든 화살표는 domain을 향한다(domain=왕, 순수). infra만 의존 역전으로 domain을 구현한다. 포트는 "필요한 레이어"에 살고(repository=domain, adapter/query=application), 구현은 전부 infra. 금지 규칙은 전부 "화살표 거스르기"다.
