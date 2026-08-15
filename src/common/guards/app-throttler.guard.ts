import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { RateLimitExceededException } from '../exceptions/common-exceptions';

/**
 * 전역 rate limit 가드.
 * 기본 ThrottlerException(HttpException)을 그대로 두면 봉투의 code가
 * COMMON_HTTP_ERROR로 뭉개지므로, 도메인 예외를 던져 전역 필터가
 * 429 + COMMON_RATE_LIMIT_EXCEEDED로 정확히 변환하게 한다.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new RateLimitExceededException();
  }
}
