import { GetArticleResult } from './dto/get-article-result';
import { ListArticlesQuery } from './dto/list-articles-query';
import { ListArticlesResult } from './dto/list-articles-result';

/**
 * 읽기 전용 통로 (CQRS). Repository와 별개 — 애그리거트 복원 없이 화면 모양대로 조회.
 * 포트는 application(유스케이스의 읽기 필요), 구현은 infra.
 */
export interface ArticleQuery {
  getArticle(id: string): Promise<GetArticleResult | null>;
  listArticles(query: ListArticlesQuery): Promise<ListArticlesResult>;
}

export const ARTICLE_QUERY = 'ArticleQuery';
