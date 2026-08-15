import { ArticleStatus } from '../article-enum';
import {
  ArticleAlreadyPublishedException,
  ArticleNotEditableException,
  InvalidArticleTitleException,
} from '../article-exceptions';
import { Article } from './article';

describe('Article', () => {
  const AUTHOR = 'author-1';

  describe('create', () => {
    it('새 글은 DRAFT 상태이고 id가 생성된다', () => {
      const article = Article.create(AUTHOR, '제목', '본문');

      expect(article.status).toBe(ArticleStatus.DRAFT);
      expect(article.id).toHaveLength(36); // uuid v4
      expect(article.authorId).toBe(AUTHOR);
    });

    it('제목이 공백뿐이면 InvalidArticleTitleException을 던진다', () => {
      expect(() => Article.create(AUTHOR, '   ', '본문')).toThrow(InvalidArticleTitleException);
    });

    it('제목이 200자를 넘으면 InvalidArticleTitleException을 던진다', () => {
      expect(() => Article.create(AUTHOR, 'a'.repeat(201), '본문')).toThrow(
        InvalidArticleTitleException,
      );
    });
  });

  describe('publish', () => {
    it('DRAFT 글을 발행하면 PUBLISHED가 된다', () => {
      const article = Article.create(AUTHOR, '제목', '본문');

      article.publish();

      expect(article.status).toBe(ArticleStatus.PUBLISHED);
    });

    it('이미 발행된 글을 또 발행하면 ArticleAlreadyPublishedException을 던진다', () => {
      const article = Article.create(AUTHOR, '제목', '본문');
      article.publish();

      expect(() => article.publish()).toThrow(ArticleAlreadyPublishedException);
    });
  });

  describe('edit', () => {
    it('DRAFT 글은 수정되어 제목·본문이 바뀐다', () => {
      const article = Article.create(AUTHOR, '제목', '본문');

      article.edit('새 제목', '새 본문');

      expect(article.title).toBe('새 제목');
      expect(article.content).toBe('새 본문');
    });

    it('발행된 글을 수정하면 ArticleNotEditableException을 던진다', () => {
      const article = Article.create(AUTHOR, '제목', '본문');
      article.publish();

      expect(() => article.edit('새 제목', '새 본문')).toThrow(ArticleNotEditableException);
    });
  });
});
