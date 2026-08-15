import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { CommonErrorCode } from '../common-error-code';
import { CommonErrorMessage } from '../common-error-message';
import { BaseException } from '../exceptions/base-exception';
import { ValidationException } from '../exceptions/common-exceptions';

/**
 * 전역 예외 필터. 모든 예외를 { code, message, result } 봉투로 변환한다.
 * ① 검증 실패(ValidationException) -> 400 + result에 필드·규칙 코드
 * ② 도메인 예외(BaseException) -> 예외의 code·status·message 그대로 (result: null)
 * ③ 그 외 프레임워크 HttpException(라우트 없음 404 등) -> 상태코드 유지 + COMMON_HTTP_ERROR
 * ④ 미처리 -> 500 INTERNAL_ERROR (원본은 로깅, 스택 노출 방지)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    // ① 검증 실패 -> 필드+규칙 코드 (BaseException보다 먼저 - 서브클래스라 순서 중요)
    if (exception instanceof ValidationException) {
      res.status(exception.status).json({
        code: exception.code,
        message: exception.message,
        result: exception.fieldErrors, // [{ field: 'name', rules: ['isString'] }]
      });
      return;
    }

    // ② 도메인 예외 -> code·status·message 그대로
    if (exception instanceof BaseException) {
      this.logger.warn({ code: exception.code, message: exception.message });
      res.status(exception.status).json({
        code: exception.code,
        message: exception.message,
        result: null,
      });
      return;
    }

    // ③ 그 외 프레임워크 HttpException -> HTTP 상태는 정직하게 유지 (404가 500이 되지 않게)
    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json({
        code: CommonErrorCode.COMMON_HTTP_ERROR,
        message: exception.message,
        result: null,
      });
      return;
    }

    // ④ 미처리 -> INTERNAL_ERROR (스택 노출 방지)
    this.logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : exception,
    );
    res.status(500).json({
      code: CommonErrorCode.INTERNAL_ERROR,
      message: CommonErrorMessage.INTERNAL_ERROR,
      result: null,
    });
  }
}
