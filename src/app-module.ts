import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { THROTTLE_LIMIT, THROTTLE_TTL_MS } from './common/common-constant';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './common/guards/jwt-strategy';
import { buildLoggerOptions } from './common/logging/logger-options';
import { AppConfigModule } from './config/config-module';
import { EnvSchema } from './config/env-validation';
import { DatabaseModule } from './database/database-module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({ inject: [EnvSchema], useFactory: buildLoggerOptions }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }] }),
    PassportModule,
    DatabaseModule,
    // 도메인 모듈은 여기에 추가 (예: ArticleModule) — 샘플 도메인 참고
  ],
  providers: [
    JwtStrategy,
    // 전역 가드 - 등록 순서대로 실행: rate limit -> 인증
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
