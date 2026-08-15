import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { AppThrottlerGuard } from './app-throttler.guard';

const TEST_LIMIT = 3;

@Controller('stub')
class StubController {
  @Get('ok')
  ok(): { hello: string } {
    return { hello: 'world' };
  }
}

describe('AppThrottlerGuard', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // 테스트용 낮은 한도 - 배선(가드->도메인 예외->필터 봉투)은 실제와 동일
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: TEST_LIMIT }] }),
      ],
      controllers: [StubController],
      providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('한도 내 요청은 통과하고, 초과분은 429 + COMMON_RATE_LIMIT_EXCEEDED 봉투를 받는다', async () => {
    for (let i = 0; i < TEST_LIMIT; i += 1) {
      await request(app.getHttpServer()).get('/stub/ok').expect(200);
    }

    const res = await request(app.getHttpServer()).get('/stub/ok').expect(429);

    expect(res.body).toEqual({
      code: 'COMMON_RATE_LIMIT_EXCEEDED',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
      result: null,
    });
  });
});
