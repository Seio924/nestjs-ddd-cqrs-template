import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvSchema } from '../../config/env-validation';

/**
 * Swagger /docs 노출 (api-docs.md).
 * - 운영(production)은 비노출 - 내부 스펙을 외부에 광고하지 않는다
 * - 프론트가 orval 등으로 타입/클라이언트를 생성하는 소스이므로 스웨거 품질 = 프론트 개발 경험
 * - /docs는 SwaggerModule이 어댑터에 직접 등록하는 라우트라 전역 가드(JwtAuthGuard) 영향 없음
 */
export function setupSwagger(app: INestApplication, env: EnvSchema): void {
  if (env.NODE_ENV === 'production') return;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('API')
      .setDescription('NestJS DDD/CQRS 템플릿 API - 모든 응답은 { code, message, result } 봉투')
      .setVersion('v1')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);
}
