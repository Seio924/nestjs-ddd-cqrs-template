import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { EnvSchema } from '../config/env-validation';

/**
 * 공유 DB 모듈 (런타임 접속).
 * - synchronize는 false - 스키마 변경은 마이그레이션으로만(운영 안전).
 * - SnakeNamingStrategy: 엔티티의 camelCase 속성을 snake_case 컬럼(created_at 등)에 자동 매핑.
 * - dataSourceFactory에서 typeorm-transactional에 DataSource를 등록해
 *   @Transactional() 데코레이터(CLS 기반)가 이 커넥션으로 동작하게 한다.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvSchema],
      useFactory: (env: EnvSchema) => ({
        type: 'mysql',
        url: env.DATABASE_URL,
        autoLoadEntities: true, // 각 도메인 모듈이 forFeature로 등록한 엔티티 자동 수집
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        timezone: 'Z', // datetime을 UTC로 읽고 쓴다
      }),
      dataSourceFactory: (options) => {
        if (!options) throw new Error('DataSource 옵션이 없습니다');
        return Promise.resolve(addTransactionalDataSource(new DataSource(options)));
      },
    }),
  ],
})
export class DatabaseModule {}
