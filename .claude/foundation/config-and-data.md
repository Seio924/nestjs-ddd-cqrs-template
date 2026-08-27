# 설정 & 데이터 (환경변수 · 트랜잭션)

## 설정 / 환경변수

- `@nestjs/config`를 전역 등록. 환경변수는 **부팅 시 스키마 검증**(class-validator)하고, 하나라도 누락/형식오류면 **기동 실패**(fail-fast)시킨다.
- 코드에서 `process.env` 직접 접근 금지 → 검증된 `EnvSchema` 인스턴스 주입으로만.

```ts
// config/env-validation.ts (요지)
export class EnvSchema {
  @IsIn(['development', 'test', 'production']) NODE_ENV = 'development';
  @IsNumber() PORT = 4000;
  @IsString() DATABASE_URL!: string;      // TypeORM 접속
  @IsString() WEB_ORIGIN!: string;        // CORS 허용 오리진(콤마 구분 다중)
  @IsString() JWT_ACCESS_SECRET!: string; // 인증 가드
}
```

## CORS

```ts
// main.ts
app.enableCors({ origin: env.webOrigins, credentials: true });
```
- 허용 오리진은 `WEB_ORIGIN`(env)로 주입 — 환경별 값은 배포 설정에서.

---

## 트랜잭션

- `@Transactional()` 데코레이터(`typeorm-transactional`)를 쓴다 — Spring `@Transactional`과 같은 경험(AsyncLocalStorage/CLS). tx/manager를 파라미터로 넘기지 않아 **repository 시그니처가 깨끗**하다.
- `main.ts`에서 `initializeTransactionalContext()`를 bootstrap 전에 **1회** 호출.
- 트랜잭션 경계 = 비즈니스 단위, **application(command service)이 소유**(교차 도메인 원자성도 여기서).
- ✅ 같은 클래스 내부 self-invocation도 트랜잭션이 걸린다 — typeorm-transactional이 프로토타입 메서드를 in-place로 교체하기 때문(Spring AOP 프록시와 다름).
- 상세는 [repository-pattern](../architecture/repository-pattern.md) 참조.
