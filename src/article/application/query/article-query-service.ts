import { Inject, Injectable } from '@nestjs/common';
import { ArticleNotFoundException } from '../../article-exceptions';
import { ARTICLE_QUERY, ArticleQuery } from './article-query';
import { GetArticleResult } from './dto/get-article-result';
import { ListArticlesQuery } from './dto/list-articles-query';
import { ListArticlesResult } from './dto/list-articles-result';

/** 읽기 유스케이스 — Repository는 절대 쓰지 않는다(쓰기 전용). Query 통로로 위임 + 가드. */
@Injectable()
export class ArticleQueryService {
  constructor(@Inject(ARTICLE_QUERY) private readonly articleQuery: ArticleQuery) {}

  async getArticle(id: string): Promise<GetArticleResult> {
    const article = await this.articleQuery.getArticle(id);
    if (!article) throw new ArticleNotFoundException(); // 배선 가드
    return article;
  }

  listArticles(query: ListArticlesQuery): Promise<ListArticlesResult> {
    return this.articleQuery.listArticles(query);
  }
}
