import { GetArticleResult } from './get-article-result';
import { ListArticlesResult } from './list-articles-result';

/** 오프셋 페이지네이션 입력 (page: 0-based, take: 크기) */
export interface ListArticlesQuery {
  page: number;
  take: number;
}

/**
 * 읽기 전용 통로 (CQRS). Repository와 별개 — 애그리거트 복원 없이 화면 모양대로 조회.
 * 포트는 application(유스케이스의 읽기 필요), 구현은 infra.
 */
export interface ArticleQuery {
  getArticle(id: string): Promise<GetArticleResult | null>;
  listArticles(query: ListArticlesQuery): Promise<ListArticlesResult>;
}

export const ARTICLE_QUERY = 'ArticleQuery';
