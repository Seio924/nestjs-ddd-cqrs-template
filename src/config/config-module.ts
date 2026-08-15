import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvSchema, getValidatedEnv, validateEnv } from './env-validation';

/**
 * 전역 설정 모듈.
 * ① .env 로딩 + 부팅 시 validateEnv 실행(실패 시 기동 중단 — fail-fast)
 * ② 검증 완료된 EnvSchema 인스턴스를 전역 주입 — 앱 코드는 `env.PORT`처럼
 *    타입 안전하게 접근한다(문자열 키 없음, 오타는 컴파일 에러).
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ validate: validateEnv })],
  providers: [{ provide: EnvSchema, useFactory: getValidatedEnv }],
  exports: [EnvSchema],
})
export class AppConfigModule {}
