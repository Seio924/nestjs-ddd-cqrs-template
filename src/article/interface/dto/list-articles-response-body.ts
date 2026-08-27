import { ApiProperty } from '@nestjs/swagger';
import { ListArticlesResult } from '../../application/query/dto/list-articles-result';
import { ArticleStatus } from '../../article-enum';

export class ArticleListItemBody {
  @ApiProperty({ example: '9f5f57b0-1111-2222-3333-444455556666' })
  id!: string;

  @ApiProperty({ example: 'author-uuid' })
  authorId!: string;

  @ApiProperty({ example: '첫 번째 글' })
  title!: string;

  @ApiProperty({ enum: ArticleStatus, example: ArticleStatus.PUBLISHED })
  status!: ArticleStatus;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

export class ListArticlesResponseBody {
  @ApiProperty({ type: [ArticleListItemBody], description: '게시글 목록 (도메인 복수형 키)' })
  articles!: ArticleListItemBody[];

  @ApiProperty({ example: 42, description: '전체 개수' })
  count!: number;

  static of(result: ListArticlesResult): ListArticlesResponseBody {
    const body = new ListArticlesResponseBody();
    body.articles = result.articles.map((item) => ({
      id: item.id,
      authorId: item.authorId,
      title: item.title,
      status: item.status,
      createdAt: item.createdAt,
    }));
    body.count = result.count;
    return body;
  }
}
