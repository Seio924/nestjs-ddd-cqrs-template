import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app-module';
import { EnvSchema } from './config/env-validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import { setupSecurity } from './common/security/setup-security';
import { setupSwagger } from './common/swagger/setup-swagger';

async function bootstrap(): Promise<void> {
  initializeTransactionalContext(); // @Transactional() CLS 컨텍스트 - DataSource 생성 전 1회 (config-and-data.md)

  // bufferLogs: pino 로거가 준비되기 전의 부팅 로그를 버퍼에 모았다가 pino로 출력
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const env = app.get(EnvSchema); // 검증 완료된 타입 안전 설정

  // Nest 내장 Logger(필터의 warn/error 등)가 전부 pino(구조화 JSON)로 나가게 교체
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('v1'); // API URL 버전 — 브레이킹 때만 /v2 병행 (git.md)
  setupSecurity(app, env); // helmet + CORS(WEB_ORIGIN만)
  app.useGlobalPipes(new AppValidationPipe()); // DTO 검증 - 실패 시 필드+규칙 코드로 구조화
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app, env); // /docs - 운영은 비노출

  await app.listen(env.PORT);
}

void bootstrap();
