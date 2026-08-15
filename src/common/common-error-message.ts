/** 횡단(common) 에러 메시지 - common-error-code.ts 와 1:1 */
export const CommonErrorMessage = {
  AUTH_UNAUTHORIZED: '인증이 필요합니다',
  VALIDATION_FAILED: '입력값이 올바르지 않습니다',
  COMMON_RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
  INTERNAL_ERROR: '서버 오류가 발생했습니다',
} as const;
