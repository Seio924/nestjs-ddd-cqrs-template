import { IncomingMessage, ServerResponse } from 'node:http';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { EnvSchema } from '../../config/env-validation';
import { assignTraceId, buildPinoHttpOptions, TRACE_ID_HEADER } from './logger-options';

describe('assignTraceId', () => {
  function createRes(): ServerResponse & { headers: Record<string, string> } {
    const headers: Record<string, string> = {};
    return {
      headers,
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
    } as unknown as ServerResponse & { headers: Record<string, string> };
  }

  it('호출자가 보낸 X-Trace-Id가 있으면 이어받는다', () => {
    const req = { headers: { 'x-trace-id': 'incoming-trace' } } as unknown as IncomingMessage;
    const res = createRes();

    expect(assignTraceId(req, res)).toBe('incoming-trace');
    expect(res.headers[TRACE_ID_HEADER]).toBe('incoming-trace');
  });

  it('없으면 새로 발급하고 응답 헤더에 노출한다', () => {
    const req = { headers: {} } as unknown as IncomingMessage;
    const res = createRes();

    const traceId = assignTraceId(req, res);

    expect(traceId).toBeTruthy();
    expect(res.headers[TRACE_ID_HEADER]).toBe(traceId);
  });
});

describe('로깅 통합 (구조화 JSON·traceId·redact)', () => {
  @Controller('stub')
  class StubController {
    @Get('ok')
    ok(): { hello: string } {
      return { hello: 'world' };
    }
  }

  let app: INestApplication;
  const lines: string[] = [];

  beforeAll(async () => {
    const env = Object.assign(new EnvSchema(), { DATABASE_URL: 'mysql://t@t/t' });
    const options = buildPinoHttpOptions(env);

    const moduleRef = await Test.createTestingModule({
      imports: [
        // 실제 설정 그대로 + 출력만 메모리 스트림으로 가로챔
        LoggerModule.forRoot({
          pinoHttp: [options, { write: (line: string) => void lines.push(line) }],
        }),
      ],
      controllers: [StubController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('요청 완료 로그가 JSON이고, traceId가 응답 헤더와 로그(req.id)에 함께 남는다', async () => {
    const res = await request(app.getHttpServer())
      .get('/stub/ok')
      .set(TRACE_ID_HEADER, 'trace-abc')
      .expect(200);

    expect(res.headers[TRACE_ID_HEADER.toLowerCase()]).toBe('trace-abc');

    const completed = lines.map((l) => JSON.parse(l)).find((l) => l.req?.id === 'trace-abc');
    expect(completed).toBeDefined();
    expect(completed.res.statusCode).toBe(200);
    expect(completed.responseTime).toBeDefined(); // 메서드·경로·status·소요시간 (observability.md)
  });

  it('Authorization 헤더 등 민감정보는 [REDACTED]로 마스킹된다', async () => {
    await request(app.getHttpServer())
      .get('/stub/ok')
      .set('Authorization', 'Bearer secret-token-123')
      .expect(200);

    const logged = lines.map((l) => JSON.parse(l)).find((l) => l.req?.headers?.authorization);
    expect(logged.req.headers.authorization).toBe('[REDACTED]');
    expect(lines.join('')).not.toContain('secret-token-123');
  });
});
