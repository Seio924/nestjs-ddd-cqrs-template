# 테스트

## 무엇을 어디까지 테스트하나

| 레이어 | 테스트 종류 | 범위 |
|---|---|---|
| Domain (애그리거트) | **단위 테스트 (주력)** | 규칙·불변식·예외. 순수 TS라 mock 불필요. |
| Service | **단위 테스트** | public 메서드. repository는 mock. |
| Repository | 통합 테스트 (선별) | 복잡한 쿼리만. 테스트 DB 사용. |
| Controller | E2E (선별) | 핵심 API 흐름만. |

- 🔴 도메인 규칙(애그리거트 메서드)과 Service의 public 메서드는 테스트를 작성한다.
- ⚪ 단순 위임(1줄 delegate)만 하는 메서드는 예외.

## 반드시 테스트할 것

1. **비즈니스 규칙 위반** — 상태 전이 불가, 권한 없음, 마감된 리소스 접근
2. **경계 조건** — 빈 결과, 0개, 최대 길이, 첫/마지막 항목
3. **예외 경로** — 없는 리소스 조회, 중복 생성, 잘못된 상태 전이
4. **예외의 타입** — generic Error가 아니라 도메인 예외 클래스인지 확인

```ts
// ✅ 예외 타입까지 검증한다
expect(() => article.publish()).toThrow(ArticleAlreadyPublishedException)
```

> `@Transactional` 메서드는 실제 DB tx가 필요하므로, 단위 테스트에선 `jest.mock('typeorm-transactional')`로 데코레이터를 무력화하거나 통합 테스트로 검증한다.

## 테스트하지 않을 것

- 프레임워크 동작 (Nest DI가 작동하는지)
- 라이브러리 동작 (TypeORM이 쿼리를 날리는지)
- 타입 시스템이 이미 보장하는 것
- 단순 getter/위임

## 테스트 이름

- `describe` — **영어**. 테스트 대상(클래스명, 메서드명)을 코드와 동일하게.
- `it` — **한글**. "~하면 ~한다" 형태로 행위를 서술.

```ts
describe('ArticleCommandService', () => {
  describe('publish', () => {
    it('없는 글을 발행하면 ArticleNotFoundException을 던진다', async () => {})
    it('이미 발행된 글을 또 발행하면 ArticleAlreadyPublishedException을 던진다', async () => {})
  })
})
```

- 🔴 `it('should ...')` 같은 관성적 영어 표현 금지. 무엇이 보장되는지 한글로 쓴다.

## 테스트 구조

- 🟡 given-when-then 순서로 작성한다. 주석은 필요할 때만.
- 🔴 테스트 파일 위치: 대상 파일과 같은 폴더, `*.spec.ts`
- 🔴 E2E는 `test/` 폴더, `*.e2e-spec.ts`

## 커버리지

- ⚪ 숫자 목표를 강제하지 않는다. 커버리지를 채우려는 의미 없는 테스트가 늘어난다.
- 🟡 대신 [반드시 테스트할 것](#반드시-테스트할-것)이 빠지지 않았는지 리뷰에서 확인한다.
