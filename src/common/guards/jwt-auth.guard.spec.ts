import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EnvSchema } from '../../config/env-validation';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { AuthUser } from './auth-user';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt-strategy';

const TEST_SECRET = 'test-access-secret';

@Controller('stub')
class StubController {
  @Public()
  @Get('public')
  publicRoute(): { ok: boolean } {
    return { ok: true };
  }

  @Get('protected')
  protectedRoute(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}

describe('JwtAuthGuard (전역 가드 통합)', () => {
  let app: INestApplication;
  const jwtService = new JwtService({ secret: TEST_SECRET });

  beforeAll(async () => {
    const env = Object.assign(new EnvSchema(), {
      DATABASE_URL: 'mysql://t@t/t',
      WEB_ORIGIN: 'https://example.com',
      JWT_ACCESS_SECRET: TEST_SECRET,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [StubController],
      providers: [
        JwtStrategy,
        { provide: EnvSchema, useValue: env },
        { provide: APP_GUARD, useClass: JwtAuthGuard }, // main과 동일한 전역 등록
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('@Public() 엔드포인트는 토큰 없이 접근할 수 있다', async () => {
    const res = await request(app.getHttpServer()).get('/stub/public').expect(200);

    expect(res.body).toEqual({ code: 'SUCCESS', message: '요청 성공', result: { ok: true } });
  });

  it('보호 엔드포인트는 토큰이 없으면 401 AUTH_UNAUTHORIZED 봉투를 받는다', async () => {
    const res = await request(app.getHttpServer()).get('/stub/protected').expect(401);

    expect(res.body).toEqual({
      code: 'AUTH_UNAUTHORIZED',
      message: '인증이 필요합니다',
      result: null,
    });
  });

  it('서명이 다른(위조) 토큰이면 401을 받는다', async () => {
    const forged = new JwtService({ secret: 'wrong-secret' }).sign({ sub: 'user-1' });

    await request(app.getHttpServer())
      .get('/stub/protected')
      .set('Authorization', `Bearer ${forged}`)
      .expect(401);
  });

  it('만료된 토큰이면 401을 받는다', async () => {
    const expired = jwtService.sign({ sub: 'user-1' }, { expiresIn: '0s' });

    await request(app.getHttpServer())
      .get('/stub/protected')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
  });

  it('유효한 토큰이면 통과하고 @CurrentUser()로 인증 유저가 주입된다', async () => {
    const token = jwtService.sign({ sub: 'user-1' }, { expiresIn: '15m' });

    const res = await request(app.getHttpServer())
      .get('/stub/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.result).toEqual({ userId: 'user-1' });
  });
});
