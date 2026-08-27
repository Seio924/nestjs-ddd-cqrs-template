import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { ArticleNotFoundException } from '../../article-exceptions';
import { Article } from '../../domain/article';
import { ARTICLE_REPOSITORY, ArticleRepository } from '../../domain/article-repository';
import { CreateArticleCommand } from './dto/create-article-command';
import { UpdateArticleCommand } from './dto/update-article-command';

/**
 * 쓰기 유스케이스 배선 (로드→도메인메서드→save). 도메인 규칙(if)은 애그리거트가 가진다.
 * @Transactional()로 메서드 전체가 한 트랜잭션 (repository-pattern.md).
 */
@Injectable()
export class ArticleCommandService {
  constructor(@Inject(ARTICLE_REPOSITORY) private readonly articleRepo: ArticleRepository) {}

  @Transactional()
  async create(command: CreateArticleCommand): Promise<string> {
    const article = Article.create(command.authorId, command.title, command.content);
    await this.articleRepo.save(article);
    return article.id;
  }

  @Transactional()
  async update(id: string, command: UpdateArticleCommand): Promise<void> {
    const article = await this.getArticle(id);
    article.edit(command.title, command.content);
    await this.articleRepo.save(article);
  }

  @Transactional()
  async publish(id: string): Promise<void> {
    const article = await this.getArticle(id);
    article.publish();
    await this.articleRepo.save(article);
  }

  @Transactional()
  async delete(id: string): Promise<void> {
    await this.getArticle(id); // 존재 확인
    await this.articleRepo.delete(id);
  }

  /** 배선 가드 — 불러왔는데 없으면 404 (도메인 규칙 아님) */
  private async getArticle(id: string): Promise<Article> {
    const article = await this.articleRepo.findById(id);
    if (!article) throw new ArticleNotFoundException();
    return article;
  }
}
