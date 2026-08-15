import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SUCCESS_CODE, SUCCESS_MESSAGE } from '../common-constant';
import { ApiEnvelope } from '../dto/api-envelope';

const NO_CONTENT_STATUS: number = HttpStatus.NO_CONTENT;

/**
 * 성공 응답을 { code, message, result } 봉투로 감싼다.
 * Controller는 순수 데이터(DTO)만 반환한다. 204 등 바디 없는 응답은 래핑하지 않는다.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiEnvelope<T | null> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T | null> | undefined> {
    return next.handle().pipe(
      map((result) => {
        const res = context.switchToHttp().getResponse<Response>();
        if (res.statusCode === NO_CONTENT_STATUS) return undefined;
        return {
          code: SUCCESS_CODE,
          message: SUCCESS_MESSAGE,
          result: result ?? null,
        };
      }),
    );
  }
}
