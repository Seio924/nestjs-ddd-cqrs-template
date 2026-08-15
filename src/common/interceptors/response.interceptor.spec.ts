import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function createContext(statusCode: number): ExecutionContext {
  return {
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
  } as unknown as ExecutionContext;
}

function createNext<T>(value: T): CallHandler<T> {
  return { handle: () => of(value) };
}

describe('ResponseInterceptor', () => {
  describe('intercept', () => {
    it('성공 응답을 { code, message, result } 봉투로 감싼다', async () => {
      const interceptor = new ResponseInterceptor<{ id: string }>();
      const data = { id: 'abc' };

      const wrapped = await firstValueFrom(
        interceptor.intercept(createContext(HttpStatus.OK), createNext(data)),
      );

      expect(wrapped).toEqual({ code: 'SUCCESS', message: '요청 성공', result: data });
    });

    it('반환값이 없으면 result를 null로 채운다', async () => {
      const interceptor = new ResponseInterceptor<undefined>();

      const wrapped = await firstValueFrom(
        interceptor.intercept(createContext(HttpStatus.OK), createNext(undefined)),
      );

      expect(wrapped).toEqual({ code: 'SUCCESS', message: '요청 성공', result: null });
    });

    it('204 No Content 응답은 래핑하지 않는다', async () => {
      const interceptor = new ResponseInterceptor<undefined>();

      const wrapped = await firstValueFrom(
        interceptor.intercept(createContext(HttpStatus.NO_CONTENT), createNext(undefined)),
      );

      expect(wrapped).toBeUndefined();
    });
  });
});
