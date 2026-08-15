import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * TypeORM CLI(마이그레이션) 전용 DataSource.
 * 앱 런타임 접속은 database-module.ts(EnvSchema 주입)가 담당한다.
 * CLI는 Nest 컨텍스트 밖에서 돌아 여기서만 예외적으로 process.env를 읽는다(dotenv).
 * 스키마 변경은 synchronize가 아니라 migrations/의 마이그레이션으로만 한다.
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: ['src/**/infrastructure/entity/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  timezone: 'Z',
  logging: false,
});

export default AppDataSource;
