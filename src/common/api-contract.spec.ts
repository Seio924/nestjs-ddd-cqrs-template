import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  INestApplication,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import { BaseException } from './exceptions/base-exception';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AppValidationPipe } from './pipes/app-validation.pipe';

/**
 * API 계약(봉투·예외 필터·검증 파이프)이 실제 HTTP 파이프라인에서
 * 함께 동작하는지 검증한다. DB 불필요 - 스텁 컨트롤러만 사용.
 */
class StubForbiddenException extends BaseException {
  readonly code = 'STUB_FORBIDDEN';
  readonly status = 403;

  constructor() {
    super('권한이 없습니다');
  }
}

class CreateStubRequestBody {
  @IsString()
  name!: string;
}

@Controller('stub')
class StubController {
  @Get('ok')
  ok(): { hello: string } {
    return { hello: 'world' };
  }

  @Get('no-content')
  @HttpCode(HttpStatus.NO_CONTENT)
  noContent(): void {}

  @Get('domain-error')
  domainError(): never {
    throw new StubForbiddenException(); // controller는 안 잡고 필터로 흘림
  }

  @Post('validate')
  validate(@Body() body: CreateStubRequestBody): CreateStubRequestBody {
    return body;
  }
}

describe('API 계약 (봉투·필터·검증 통합)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StubController],
    }).compile();

    app = moduleRef.createNestApplication();
    // main.ts와 동일한 전역 배선
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('성공 응답은 봉투로 감싸진다', async () => {
    const res = await request(app.getHttpServer()).get('/stub/ok').expect(200);

    expect(res.body).toEqual({
      code: 'SUCCESS',
      message: '요청 성공',
      result: { hello: 'world' },
    });
  });

  it('204 응답은 바디 없이 나간다(래핑 안 함)', async () => {
    const res = await request(app.getHttpServer()).get('/stub/no-content').expect(204);

    expect(res.body).toEqual({});
  });

  it('도메인 예외는 자신의 status·code로 변환된다', async () => {
    const res = await request(app.getHttpServer()).get('/stub/domain-error').expect(403);

    expect(res.body).toEqual({
      code: 'STUB_FORBIDDEN',
      message: '권한이 없습니다',
      result: null,
    });
  });

  it('필수 필드가 없으면 400 + result에 필드·규칙 코드', async () => {
    const res = await request(app.getHttpServer()).post('/stub/validate').send({}).expect(400);

    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.result).toEqual([
      { field: 'name', rules: expect.arrayContaining(['isString']) },
    ]);
  });

  it('스키마에 없는 필드를 보내면 400 + 해당 필드의 whitelistValidation 규칙', async () => {
    const res = await request(app.getHttpServer())
      .post('/stub/validate')
      .send({ name: 'ok', hack: 'x' })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.result).toEqual([{ field: 'hack', rules: ['whitelistValidation'] }]);
  });

  it('없는 라우트는 404를 유지한 봉투로 나간다 (500으로 뭉개지지 않음)', async () => {
    const res = await request(app.getHttpServer()).get('/unknown').expect(404);

    expect(res.body.code).toBe('COMMON_HTTP_ERROR');
    expect(res.body.result).toBeNull();
  });
});
