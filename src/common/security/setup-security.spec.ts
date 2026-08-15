import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EnvSchema } from '../../config/env-validation';
import { setupSecurity } from './setup-security';

@Controller('stub')
class StubController {
  @Get('ok')
  ok(): { hello: string } {
    return { hello: 'world' };
  }
}

describe('setupSecurity (helmet + CORS)', () => {
  let app: INestApplication;
  const ALLOWED_ORIGIN = 'https://example.com';

  beforeAll(async () => {
    const env = Object.assign(new EnvSchema(), {
      DATABASE_URL: 'mysql://t@t/t',
      WEB_ORIGIN: `${ALLOWED_ORIGIN},https://dev.example.com`,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [StubController],
    }).compile();

    app = moduleRef.createNestApplication();
    setupSecurity(app, env); // main.ts와 동일 배선
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('helmet 보안 헤더가 붙고 X-Powered-By는 제거된다', async () => {
    const res = await request(app.getHttpServer()).get('/stub/ok').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined(); // 스택 정보 노출 차단
  });

  it('허용된 오리진이면 CORS 헤더(오리진 + credentials)를 내려준다', async () => {
    const res = await request(app.getHttpServer())
      .get('/stub/ok')
      .set('Origin', ALLOWED_ORIGIN)
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('허용 목록에 없는 오리진에는 CORS 허용 헤더를 내려주지 않는다', async () => {
    const res = await request(app.getHttpServer())
      .get('/stub/ok')
      .set('Origin', 'https://evil.com')
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
