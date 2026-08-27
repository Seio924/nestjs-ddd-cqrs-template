import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleQuery } from '../../application/query/article-query';
import { GetArticleResult } from '../../application/query/dto/get-article-result';
import { ListArticlesQuery } from '../../application/query/dto/list-articles-query';
import { ListArticlesResult } from '../../application/query/dto/list-articles-result';
import { ArticleEntity } from '../entity/article.entity';

/**
 * ArticleQuery 구현 — 애그리거트 안 거치고 화면 필드만 조회(CQRS 읽기).
 * 목록은 본문(content) 제외 + 오프셋 페이지네이션 + 도메인 복수형 키.
 */
@Injectable()
export class ArticleQueryImpl implements ArticleQuery {
  constructor(@InjectRepository(ArticleEntity) private readonly repo: Repository<ArticleEntity>) {}

  async getArticle(id: string): Promise<GetArticleResult | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      authorId: row.authorId,
      title: row.title,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt,
    };
  }

  async listArticles(query: ListArticlesQuery): Promise<ListArticlesResult> {
    const [rows, count] = await this.repo
      .createQueryBuilder('a')
      .select(['a.id', 'a.authorId', 'a.title', 'a.status', 'a.createdAt'])
      .orderBy('a.createdAt', 'DESC')
      .addOrderBy('a.id', 'DESC') // tie-breaker (pagination.md)
      .take(query.take)
      .skip(query.page * query.take)
      .getManyAndCount();

    return {
      articles: rows.map((r) => ({
        id: r.id,
        authorId: r.authorId,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
      })),
      count,
    };
  }
}
