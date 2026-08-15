import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleCommandService } from './application/command/article-command-service';
import { ARTICLE_QUERY } from './application/query/article-query';
import { ArticleQueryService } from './application/query/article-query-service';
import { ARTICLE_REPOSITORY } from './domain/article-repository';
import { ArticleEntity } from './infrastructure/entity/article.entity';
import { ArticleQueryImpl } from './infrastructure/query/article-query-impl';
import { ArticleRepositoryImpl } from './infrastructure/repository/article-repository-impl';
import { ArticleController } from './interface/article-controller';

/**
 * 배선판. { provide: 포트, useClass: 구현 }으로 포트에 구현을 꽂고,
 * exports엔 service만 둬서 repository/query 노출을 DI 레벨에서 차단(module-pattern.md).
 */
@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity])],
  controllers: [ArticleController],
  providers: [
    ArticleCommandService,
    ArticleQueryService,
    { provide: ARTICLE_REPOSITORY, useClass: ArticleRepositoryImpl },
    { provide: ARTICLE_QUERY, useClass: ArticleQueryImpl },
  ],
  exports: [ArticleCommandService, ArticleQueryService],
})
export class ArticleModule {}
