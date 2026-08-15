/** 횡단(common) 에러 코드 - <DOMAIN>_<REASON> UPPER_SNAKE, 전역 유일 */
export const CommonErrorCode = {
  /** 전역 JwtAuthGuard 인증 실패 (토큰 없음/무효/만료) */
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  /** ValidationPipe 검증 실패 */
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  /** 도메인 예외가 아닌 프레임워크 HttpException (라우트 없음 404 등) */
  COMMON_HTTP_ERROR: 'COMMON_HTTP_ERROR',
  /** 전역 rate limit 초과 */
  COMMON_RATE_LIMIT_EXCEEDED: 'COMMON_RATE_LIMIT_EXCEEDED',
  /** 미처리 예외 */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
