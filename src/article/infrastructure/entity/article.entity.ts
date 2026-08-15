import { Column, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ArticleStatus } from '../../article-enum';

/**
 * articles 테이블 (TypeORM 엔티티). 도메인 Article과 별개 클래스 — 매퍼가 변환.
 * id는 도메인이 생성하므로 @PrimaryColumn(자동생성 아님, aggregate-id.md).
 * created_at은 도메인이 값을 넣으므로 일반 컬럼, updated_at·deleted_at은 TypeORM이 관리.
 */
@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  authorId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status!: ArticleStatus;

  @Column({ type: 'datetime', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt!: Date;

  /** soft delete — 조회 시 자동 제외 (repository-pattern.md) */
  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt?: Date;
}
