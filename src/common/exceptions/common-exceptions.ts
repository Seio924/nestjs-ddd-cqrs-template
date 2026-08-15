import { CommonErrorCode } from '../common-error-code';
import { CommonErrorMessage } from '../common-error-message';
import { BaseException } from './base-exception';

/** 필드 하나의 검증 실패 - 어떤 필드가 어떤 규칙을 어겼는지 */
export interface FieldValidationError {
  /** 필드 경로 (중첩이면 'profile.name') */
  field: string;
  /** 위반한 규칙 키 (class-validator 데코레이터 키: isString, isEmail, length ...) */
  rules: string[];
}

/**
 * 검증 실패 예외. ValidationPipe의 exceptionFactory가 던진다.
 * 프론트는 message가 아니라 field+rules로 분기하고, 한국어 문구는 프론트가 소유한다.
 */
export class ValidationException extends BaseException {
  readonly code = CommonErrorCode.VALIDATION_FAILED;
  readonly status = 400;

  constructor(readonly fieldErrors: FieldValidationError[]) {
    super(CommonErrorMessage.VALIDATION_FAILED);
  }
}

/** 전역 JwtAuthGuard 인증 실패 - 토큰 없음/무효/만료 (401) */
export class AuthUnauthorizedException extends BaseException {
  readonly code = CommonErrorCode.AUTH_UNAUTHORIZED;
  readonly status = 401;

  constructor() {
    super(CommonErrorMessage.AUTH_UNAUTHORIZED);
  }
}

/** 전역 rate limit 초과 (AppThrottlerGuard가 던짐) */
export class RateLimitExceededException extends BaseException {
  readonly code = CommonErrorCode.COMMON_RATE_LIMIT_EXCEEDED;
  readonly status = 429;

  constructor() {
    super(CommonErrorMessage.COMMON_RATE_LIMIT_EXCEEDED);
  }
}
