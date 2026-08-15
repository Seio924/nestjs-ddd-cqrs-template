import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/guards/auth-user';
import { ArticleCommandService } from '../application/command/article-command-service';
import { ArticleQueryService } from '../application/query/article-query-service';
import {
  CreateArticleDocs,
  DeleteArticleDocs,
  GetArticleDocs,
  ListArticlesDocs,
  PublishArticleDocs,
  UpdateArticleDocs,
} from './article-controller-docs';
import { ArticleResponseBody } from './dto/article-response-body';
import { CreateArticleRequestBody } from './dto/create-article-request-body';
import { CreateArticleResponseBody } from './dto/create-article-response-body';
import { ListArticlesRequestQuery } from './dto/list-articles-request-query';
import { ListArticlesResponseBody } from './dto/list-articles-response-body';
import { UpdateArticleRequestBody } from './dto/update-article-request-body';

/**
 * 컨트롤러는 command/query service만 주입(완결된 유스케이스). 로직·repository 직접 접근 없음.
 * 읽기(list·get)는 @Public, 쓰기는 전역 JwtAuthGuard가 인증 요구.
 */
@Controller('articles')
@ApiTags('Article')
export class ArticleController {
  constructor(
    private readonly articleCommandService: ArticleCommandService,
    private readonly articleQueryService: ArticleQueryService,
  ) {}

  @Post()
  @CreateArticleDocs()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateArticleRequestBody,
  ): Promise<CreateArticleResponseBody> {
    const id = await this.articleCommandService.create({
      authorId: user.userId,
      title: body.title,
      content: body.content,
    });
    return { id };
  }

  @Get()
  @Public()
  @ListArticlesDocs()
  async list(@Query() query: ListArticlesRequestQuery): Promise<ListArticlesResponseBody> {
    const result = await this.articleQueryService.listArticles({
      page: query.page,
      take: query.take,
    });
    return ListArticlesResponseBody.of(result);
  }

  @Get(':id')
  @Public()
  @GetArticleDocs()
  async get(@Param('id') id: string): Promise<ArticleResponseBody> {
    const result = await this.articleQueryService.getArticle(id);
    return ArticleResponseBody.of(result);
  }

  @Patch(':id')
  @UpdateArticleDocs()
  async update(@Param('id') id: string, @Body() body: UpdateArticleRequestBody): Promise<void> {
    await this.articleCommandService.update(id, { title: body.title, content: body.content });
  }

  @Post(':id/publish')
  @PublishArticleDocs()
  async publish(@Param('id') id: string): Promise<void> {
    await this.articleCommandService.publish(id);
  }

  @Delete(':id')
  @DeleteArticleDocs()
  async remove(@Param('id') id: string): Promise<void> {
    await this.articleCommandService.delete(id);
  }
}
