import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * articles 테이블 생성 (샘플 도메인).
 * 스키마 변경은 synchronize가 아니라 이런 마이그레이션으로만 한다.
 * 실행: pnpm migration:run / 되돌리기: pnpm migration:revert
 */
export class CreateArticles1710000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE articles (
        id VARCHAR(36) NOT NULL,
        author_id VARCHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        deleted_at DATETIME(3) NULL,
        PRIMARY KEY (id),
        INDEX idx_articles_created_at (created_at, id)
      ) ENGINE = InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE articles');
  }
}
