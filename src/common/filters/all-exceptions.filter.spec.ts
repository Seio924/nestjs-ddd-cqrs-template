import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { CommonErrorCode } from '../common-error-code';
import { BaseException } from '../exceptions/base-exception';
import { ValidationException } from '../exceptions/common-exceptions';
import { AllExceptionsFilter } from './all-exceptions.filter';

class StubNotFoundException extends BaseException {
  readonly code = 'STUB_NOT_FOUND';
  readonly status = 404;

  constructor() {
    super('스텁을 찾을 수 없습니다');
  }
}

function createHost() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('AllExceptionsFilter', () => {
  describe('catch', () => {
    it('도메인 예외(BaseException)면 예외의 code·status·message를 봉투로 변환한다', () => {
      const filter = new AllExceptionsFilter();
      const { host, res } = createHost();

      filter.catch(new StubNotFoundException(), host);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        code: 'STUB_NOT_FOUND',
        message: '스텁을 찾을 수 없습니다',
        result: null,
      });
    });

    it('검증 실패(ValidationException)면 400과 result에 필드·규칙 코드를 담는다', () => {
      const filter = new AllExceptionsFilter();
      const { host, res } = createHost();
      const fieldErrors = [{ field: 'email', rules: ['isEmail'] }];

      filter.catch(new ValidationException(fieldErrors), host);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: CommonErrorCode.VALIDATION_FAILED,
        message: '입력값이 올바르지 않습니다',
        result: fieldErrors, // 프론트는 field+rules로 분기, 문구는 프론트 소유
      });
    });

    it('그 외 HttpException이면 상태코드를 유지한다 (404가 500으로 뭉개지지 않음)', () => {
      const filter = new AllExceptionsFilter();
      const { host, res } = createHost();

      filter.catch(new NotFoundException('Cannot GET /v1/unknown'), host);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        code: CommonErrorCode.COMMON_HTTP_ERROR,
        message: 'Cannot GET /v1/unknown',
        result: null,
      });
    });

    it('미처리 예외면 500 INTERNAL_ERROR로 일반화한다 (스택·내부 메시지 비노출)', () => {
      const filter = new AllExceptionsFilter();
      const { host, res } = createHost();

      filter.catch(new Error('DB 커넥션 죽음 - 내부 사정'), host);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: CommonErrorCode.INTERNAL_ERROR,
        message: '서버 오류가 발생했습니다',
        result: null,
      });
    });
  });
});
