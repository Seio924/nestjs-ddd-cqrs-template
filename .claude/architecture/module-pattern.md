# 모듈 패턴 (NestJS 배선)

> 포트/어댑터/레이어가 **실제로 연결(배선)되는 곳**. 개념은 [design-principles.md](./design-principles.md), 방향은 [layer-architecture.md](./layer-architecture.md) 참고.

---

## 1. 1 도메인 = 1 NestJS 모듈

- **1 Bounded Context = 1 Module.** 기술 레이어가 아니라 **도메인**으로 모듈을 나눈다.
- 한 모듈이 4계층(domain/application/interface/infrastructure)을 모두 포함한다.
- 모듈 간 직접 의존은 최소화하고, 교차는 `imports`/`exports` + adapter로만.
- 공유 인프라(TypeORM, AuthGuard 등)는 별도 모듈로.

```
src/
  article/     ← ArticleModule (4계층 + article-module.ts)
  common/      ← 공유 유틸
  database/    ← DatabaseModule
  app-module.ts ← 루트 모듈
```

> 아래 `point`·`stat`은 교차 도메인 배선을 설명하기 위한 예시 이웃 도메인이다(샘플엔 없음).

---

## 2. 모듈 = 배선판 (전체 예시)

```ts
// article/article-module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity]),   // 이 도메인의 TypeORM 엔티티 등록
    // PointModule, StatModule,                   // 교차 도메인이 있으면 남의 모듈 import
  ],
  controllers: [ArticleController],
  providers: [
    ArticleCommandService,                        // 일반 클래스는 그대로 나열
    ArticleQueryService,
    // 포트 → 구현 배선
    { provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl },
    { provide: ARTICLE_QUERY,      useClass: ArticleQueryImpl },
    // { provide: POINT_ADAPTER,   useClass: PointAdapterImpl },
  ],
  exports: [ArticleCommandService, ArticleQueryService],  // 남한테 공개할 것만
})
export class ArticleModule {}
```

---

## 3. `{ provide: 포트, useClass: 구현 }` — 포트에 구현 꽂기

```ts
{ provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl }
```
읽는 법: **"`ARTICLE_REPOSITORY` 토큰을 요청하면 `ArticleRepositoryImpl`을 꽂아줘라."**

주입 쪽:
```ts
constructor(
  @Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository,
) {}
```
→ 포트만 알고 구현은 모르는 상태(의존 역전)가 이렇게 실현된다.

> ⚠️ 포트는 interface + InjectionToken으로 정의하므로 주입 시 `@Inject(TOKEN)`이 필요하다.

---

## 4. `exports` — 도메인의 공개 API (🔴 핵심)

```ts
exports: [ArticleCommandService, ArticleQueryService],  // ✅ service만
// repository, query, adapter, entity, infra 구현 → ❌ 절대 export 안 함
```

- 다른 도메인은 **exports에 있는 것만** 주입받을 수 있다.
- repository를 exports 안 하면 → 다른 도메인이 **주입받는 것 자체가 DI 레벨에서 거부**된다.
- 즉 "남의 repository 직접 접근 금지"가 문서 규칙이 아니라 **물리적으로 강제**된다.

---

## 5. 교차 도메인 배선 4단계 (article이 point 사용)

```ts
// 1) 포트 정의 — article/application/adapter/point-adapter.ts
export interface PointAdapter { grant(userId: string): Promise<void>; }
export const POINT_ADAPTER = 'PointAdapter';

// 2) 구현 — article/infrastructure/adapter/point-adapter-impl.ts  (여기서만 point import)
@Injectable()
export class PointAdapterImpl implements PointAdapter {
  constructor(private readonly pointService: PointCommandService) {}  // point가 export한 것
  async grant(userId: string) { return this.pointService.grant(userId); }
}

// 3) 유스케이스에서 포트 주입 — article/application/command/...
constructor(@Inject(POINT_ADAPTER) private readonly pointAdapter: PointAdapter) {}

// 4) 모듈 배선 — article-module.ts
imports: [PointModule],                                     // point의 exports를 쓸 수 있게
providers: [{ provide: POINT_ADAPTER, useClass: PointAdapterImpl }]
```

**연결고리:** `imports: [PointModule]` → point가 export한 `PointCommandService`를 article이 사용 가능 → `PointAdapterImpl`이 그것을 감쌈.
**article이 point를 import하는 곳은 오직 `point-adapter-impl.ts` 한 곳** (남의 도메인 참조는 infra 끄트머리에만 → 도메인 본체엔 순환 없음).

---

## 6. 순환 = forwardRef 금지, 설계로 해결

> A→B→A 순환이 생기면 `forwardRef()`로 우회하지 않는다. 도메인 경계를 재설계하거나 이벤트 기반으로 바꾼다.

- `forwardRef()`는 순환을 억지로 돌아가게 하는 반창고 → **금지.**
- 순환은 "경계가 잘못 그어졌다"는 신호 → 책임 재배치(design-principles §5).

---

## 7. 루트 모듈

```ts
// app-module.ts
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ArticleModule,
    // 도메인 모듈을 여기에 추가
  ],
})
export class AppModule {}
```

---

## 8. 컨트롤러 패턴

```ts
@Controller('articles')
@ApiTags('Article')
export class ArticleController {
  constructor(
    private readonly articleCommandService: ArticleCommandService,
    private readonly articleQueryService: ArticleQueryService,
  ) {}

  @Post()
  @CreateArticleDocs()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateArticleRequestBody,
  ): Promise<CreateArticleResponseBody> {
    const id = await this.articleCommandService.create({ authorId: user.userId, ...body });
    return { id };
  }
}
```

- controller는 command/query service만 주입(완결된 유스케이스). **adapter·repository는 주입하지 않는다.**
- 인증은 전역 `JwtAuthGuard` + `@Public()` 방식이다. 기본은 다 막고 공개 엔드포인트만 `@Public()`으로 연다. (안전한 기본값)
- Swagger 데코레이터는 모든 엔드포인트에(문서 데코레이터로 묶어 `interface/`에 분리).

---

## 9. 한 줄 요약

> 모듈은 배선판이다. `{ provide: 포트, useClass: 구현 }`으로 포트에 구현을 꽂고, `exports`엔 service만 둬서 repository 노출을 DI 레벨에서 차단하며, 교차는 `imports: [남의 모듈]` + adapter로 연결한다. 순환은 forwardRef가 아니라 설계로 푼다.
