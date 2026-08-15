import { Article } from './article';

/**
 * 쓰기 전용 통로 (CQRS). 읽기는 ArticleQuery가 담당한다.
 * 포트는 domain에(도메인 개념의 본질적 필요), 구현(-impl)은 infra에.
 * ⚠️ update 메서드 금지 — 로드→도메인메서드→save로만 수정(규칙 우회 차단, repository-pattern.md).
 */
export interface ArticleRepository {
  findById(id: string): Promise<Article | null>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}

/** interface는 런타임에 사라져 DI가 못 찾으므로 문자열 토큰으로 배선한다. */
export const ARTICLE_REPOSITORY = 'ArticleRepository';
