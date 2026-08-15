import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { EnvSchema } from '../../config/env-validation';

/**
 * HTTP 보안 설정 (observability.md).
 * - helmet: 보안 헤더 일괄 적용 (X-Content-Type-Options, HSTS 등) + X-Powered-By 제거
 * - CORS: WEB_ORIGIN만 허용 + credentials (허용 오리진은 env로 주입).
 * main.ts와 테스트가 같은 배선을 공유하도록 함수로 분리.
 */
export function setupSecurity(app: INestApplication, env: EnvSchema): void {
  app.use(helmet());
  app.enableCors({
    origin: env.webOrigins,
    credentials: true,
  });
}
