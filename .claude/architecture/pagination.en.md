> 🌐 [한국어](./pagination.md) · **English**

# Pagination

We **run offset (admin·search) + cursor (feed·infinite scroll) side by side**. Reason: admin tables·search need arbitrary page access and total counts, so offset fits; feed·infinite scroll needs a cursor that doesn't shift even when new items get inserted mid-scroll.

## Choosing a Strategy (by Use Case)

| | Offset (page/take) | Cursor (keyset) |
|---|---|---|
| **Fits** | admin tables, search results, "jump to page N", need total count | **feed·infinite scroll** |
| Pros | arbitrary page access, natural total count | doesn't shift on insert/delete, fast even when deep (index) |
| Cons | **page drift** (new item mid-scroll → duplicate/skip), deep OFFSET is slow | no arbitrary jump, total count separate |

- **Why a cursor for infinite scroll?** If a new item gets inserted at the top mid-scroll, the offset shifts, causing the same item to duplicate/skip. A cursor is anchored to the last item, so it doesn't shift.
- The infinite-scroll frontend (virtual list + `useInfiniteQuery`) **doesn't need a total count** → omit count in the cursor response.

## Common Rules

- The response key is the **domain plural** (`articles`) — generic keys (`result`/`data`/`items`) forbidden (inside the envelope's `result`).
- Always include `id` as the last sort key for tie-breaking (cursor stability).

## Offset (Admin·Search)

Parameters: `page` (0-based, default 0), `take` (default 20), `sort` (`createdAt:desc`).

```ts
// application/query — QueryBuilder
qb.take(query.take).skip(query.page * query.take);
const [rows, count] = await qb.getManyAndCount();
```

```jsonc
// inside the envelope: { code, message, result }
"result": { "articles": [ /* ... */ ], "count": 42 }
```

## Cursor (Feed·Infinite Scroll)

- Sort: `(createdAt DESC, id DESC)`. Cursor = base64(`{ createdAt, id }`) (the last item's values).

```sql
WHERE (createdAt, id) < (:cursorCreatedAt, :cursorId)
ORDER BY createdAt DESC, id DESC
LIMIT :take + 1        -- +1 to determine hasNext
```

```jsonc
"result": {
  "articles": [ /* ... */ ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIuLi4iLCJpZCI6Ii4uLiJ9",  // null if none
  "hasNext": true
  // no count (not needed for infinite scroll)
}
```

- Query DTO: `cursor?` (string), `take` (default 20). The first request omits `cursor`.
- Swagger expresses the `result` type precisely with the `ApiResultCursorList` family (see [api-docs](../foundation/api-docs.en.md)).

> The sample domain `article`'s list endpoint uses the offset approach. The cursor is applied to domains that need infinite scroll.
