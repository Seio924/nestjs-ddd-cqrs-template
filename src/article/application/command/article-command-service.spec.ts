// @Transactional은 실제 DB 트랜잭션이 필요하므로 단위 테스트에선 무력화한다.
// (실제 트랜잭션 동작은 테스트 DB를 쓰는 통합/e2e에서 검증)
jest.mock('typeorm-transactional', () => ({
  Transactional: () => (): void => {},
}));

import { ArticleNotFoundException } from '../../article-exceptions';
import { Article } from '../../domain/article';
import { ArticleRepository } from '../../domain/article-repository';
import { ArticleCommandService } from './article-command-service';

describe('ArticleCommandService', () => {
  let service: ArticleCommandService;
  let repo: jest.Mocked<ArticleRepository>;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ArticleRepository>;
    service = new ArticleCommandService(repo);
  });

  describe('create', () => {
    it('유효한 입력이면 저장하고 생성된 id를 반환한다', async () => {
      const id = await service.create({ authorId: 'a', title: '제목', content: '본문' });

      expect(typeof id).toBe('string');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('publish', () => {
    it('없는 글을 발행하면 ArticleNotFoundException을 던진다', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.publish('nope')).rejects.toThrow(ArticleNotFoundException);
    });

    it('있는 글을 발행하면 저장한다', async () => {
      repo.findById.mockResolvedValue(Article.create('a', '제목', '본문'));

      await service.publish('id');

      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('없는 글을 수정하면 ArticleNotFoundException을 던진다', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('nope', { title: '제목', content: '본문' })).rejects.toThrow(
        ArticleNotFoundException,
      );
    });
  });
});
