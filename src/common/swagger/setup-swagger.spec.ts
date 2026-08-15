import { Controller, Get, INestApplication } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EnvSchema } from '../../config/env-validation';
import { ApiErrors } from '../decorators/api-error.decorator';
import { ApiResult, ApiResultList } from '../decorators/api-result.decorator';
import { AuthUnauthorizedException } from '../exceptions/common-exceptions';
import { setupSwagger } from './setup-swagger';

class StubResponseBody {
  @ApiProperty({ example: 'abc' })
  id!: string;
}

@Controller('stub')
class StubController {
  @Get('one')
  @ApiResult(StubResponseBody)
  @ApiErrors(AuthUnauthorizedException)
  one(): StubResponseBody {
    return { id: 'abc' };
  }

  @Get('list')
  @ApiResultList('stubs', StubResponseBody)
  list(): { stubs: StubResponseBody[] } {
    return { stubs: [] };
  }
}

function buildEnv(nodeEnv: 'development' | 'production'): EnvSchema {
  return Object.assign(new EnvSchema(), {
    NODE_ENV: nodeEnv,
    DATABASE_URL: 'mysql://t@t/t',
    WEB_ORIGIN: 'https://example.com',
    JWT_ACCESS_SECRET: 'test',
  });
}

async function createApp(nodeEnv: 'development' | 'production'): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ controllers: [StubController] }).compile();
  const app = moduleRef.createNestApplication();
  setupSwagger(app, buildEnv(nodeEnv)); // main.ts와 동일 배선
  await app.init();
  return app;
}

describe('setupSwagger', () => {
  it('개발 환경에선 /docs가 열린다', async () => {
    const app = await createApp('development');

    await request(app.getHttpServer()).get('/docs').expect(200);

    await app.close();
  });

  it('운영 환경에선 /docs가 존재하지 않는다', async () => {
    const app = await createApp('production');

    await request(app.getHttpServer()).get('/docs').expect(404);

    await app.close();
  });

  it('OpenAPI 문서에서 성공 응답이 봉투(ApiResponseDto) + result: 실제 타입으로 표현된다', async () => {
    const app = await createApp('development');

    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const doc = res.body;

    const schema = doc.paths['/stub/one'].get.responses['200'].content['application/json'].schema;
    expect(schema.allOf[0].$ref).toBe('#/components/schemas/ApiResponseDto');
    expect(schema.allOf[1].properties.result.$ref).toBe('#/components/schemas/StubResponseBody');

    // 봉투 스키마 자체도 code·message를 노출
    expect(doc.components.schemas.ApiResponseDto.properties.code.example).toBe('SUCCESS');

    await app.close();
  });

  it('목록 응답은 도메인 복수형 키 + count로 표현된다 (제네릭 키 금지)', async () => {
    const app = await createApp('development');

    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const result =
      res.body.paths['/stub/list'].get.responses['200'].content['application/json'].schema.allOf[1]
        .properties.result;

    expect(result.properties.stubs.type).toBe('array');
    expect(result.properties.count.type).toBe('number');
    expect(result.required).toEqual(['stubs', 'count']);

    await app.close();
  });

  it('에러 응답이 도메인 예외의 status·code로 문서화된다', async () => {
    const app = await createApp('development');

    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const responses = res.body.paths['/stub/one'].get.responses;

    expect(responses['401'].description).toContain('AUTH_UNAUTHORIZED');

    await app.close();
  });
});
