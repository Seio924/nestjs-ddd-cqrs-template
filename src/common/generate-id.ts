import { randomUUID } from 'node:crypto';

/**
 * 애그리거트 ID 생성 (도메인이 생성 — DB auto-increment 아님, aggregate-id.md).
 * 기본은 UUID v4. 정렬 가능 ID가 필요하면 uuidv7/ULID/cuid2로 이 함수만 교체하면 된다.
 */
export function generateId(): string {
  return randomUUID();
}
