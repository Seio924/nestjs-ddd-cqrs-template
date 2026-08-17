# 페이지네이션

**오프셋(관리자·검색) + 커서(피드·무한스크롤)를 병행**한다. 이유: 관리자 테이블·검색은 임의 페이지 접근과 총개수가 필요해 오프셋이 맞고, 피드·무한스크롤은 스크롤 중 새 항목이 꽂혀도 안 밀리는 커서가 맞기 때문이다.

## 전략 선택 (용도별)

| | 오프셋(page/take) | 커서(keyset) |
|---|---|---|
| **적합** | 관리자 테이블, 검색결과, "N페이지 점프", 총개수 필요 | **피드·무한스크롤** |
| 장점 | 임의 페이지 접근, total count 자연스러움 | 삽입/삭제에도 안 밀림, 깊어져도 빠름(인덱스) |
| 단점 | **페이지 드리프트**(스크롤 중 새 항목 → 중복/누락), 깊은 OFFSET 느림 | 임의 점프 불가, total count 별도 |

- **왜 무한스크롤엔 커서?** 스크롤 중 새 항목이 위에 꽂히면 offset이 밀려 같은 항목 중복/누락. 커서는 마지막 아이템 기준이라 안 밀린다.
- 무한스크롤 프론트(가상 리스트 + `useInfiniteQuery`)는 **total count 불필요** → 커서 응답에 count 생략.

## 공통 규칙

- 응답 키는 **도메인 복수형**(`articles`) — 제네릭 키(`result`/`data`/`items`) 금지(봉투 `result` 안쪽에서).
- 정렬 tie-breaker로 `id`를 항상 마지막 정렬키에 포함(커서 안정성).

## 오프셋 (관리자·검색)

파라미터: `page`(0-based, 기본 0), `take`(기본 20), `sort`(`createdAt:desc`).

```ts
// application/query — QueryBuilder
qb.take(query.take).skip(query.page * query.take);
const [rows, count] = await qb.getManyAndCount();
```

```jsonc
// 봉투 안: { code, message, result }
"result": { "articles": [ /* ... */ ], "count": 42 }
```

## 커서 (피드·무한스크롤)

- 정렬: `(createdAt DESC, id DESC)`. 커서 = base64(`{ createdAt, id }`)(마지막 아이템 값).

```sql
WHERE (createdAt, id) < (:cursorCreatedAt, :cursorId)
ORDER BY createdAt DESC, id DESC
LIMIT :take + 1        -- +1로 hasNext 판단
```

```jsonc
"result": {
  "articles": [ /* ... */ ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIuLi4iLCJpZCI6Ii4uLiJ9",  // 없으면 null
  "hasNext": true
  // count 없음 (무한스크롤엔 불필요)
}
```

- Query DTO: `cursor?`(string), `take`(기본 20). 첫 요청은 `cursor` 생략.
- 스웨거는 `ApiResultCursorList` 계열로 `result` 타입을 정확히 표현([api-docs](../foundation/api-docs.md) 참조).

> 샘플 도메인 `article`의 목록 엔드포인트는 오프셋 방식을 쓴다. 커서는 무한스크롤이 필요한 도메인에 적용한다.
