/** 성공 응답 봉투 값 */
export const SUCCESS_CODE = 'SUCCESS';
export const SUCCESS_MESSAGE = '요청 성공';

/** 전역 rate limit - IP당 1분에 100회 (auth 브루트포스 방어의 기본선, observability.md) */
export const THROTTLE_TTL_MS = 60_000;
export const THROTTLE_LIMIT = 100;
