import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../domain/article';
import { ArticleRepository } from '../../domain/article-repository';
import { ArticleEntity } from '../entity/article.entity';

/**
 * ArticleRepository 포트 구현 + 매퍼(도메인 ↔ TypeORM 엔티티).
 * TypeORM은 infra인 여기서만 import — 도메인은 순수 유지(그 비용이 이 매퍼).
 */
@Injectable()
export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(@InjectRepository(ArticleEntity) private readonly repo: Repository<ArticleEntity>) {}

  async findById(id: string): Promise<Article | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toModel(entity) : null;
  }

  async save(article: Article): Promise<void> {
    await this.repo.save(this.toEntity(article));
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete({ id });
  }

  /** 매퍼: 도메인 → TypeORM 엔티티 */
  private toEntity(a: Article): ArticleEntity {
    const entity = new ArticleEntity();
    entity.id = a.id;
    entity.authorId = a.authorId;
    entity.title = a.title;
    entity.content = a.content;
    entity.status = a.status;
    entity.createdAt = a.createdAt;
    return entity;
  }

  /** 매퍼: TypeORM 엔티티 → 도메인 */
  private toModel(e: ArticleEntity): Article {
    return Article.restore({
      id: e.id,
      authorId: e.authorId,
      title: e.title,
      content: e.content,
      status: e.status,
      createdAt: e.createdAt,
    });
  }
}
