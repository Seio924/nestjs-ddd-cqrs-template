import { InvalidArticleTitleException } from '../article-exceptions';

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;

/**
 * 제목 값 객체(VO). 불변 + 생성 시 자가검증 → 잘못된 제목은 존재 자체가 불가.
 * (VO는 '규칙이 중요한 값'에만 쓴다 — 나머지는 원시타입. tactical-ddd.md)
 */
export class ArticleTitle {
  private constructor(readonly value: string) {}

  static of(raw: string): ArticleTitle {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_TITLE_LENGTH || trimmed.length > MAX_TITLE_LENGTH) {
      throw new InvalidArticleTitleException();
    }
    return new ArticleTitle(trimmed);
  }

  equals(other: ArticleTitle): boolean {
    return this.value === other.value;
  }
}
