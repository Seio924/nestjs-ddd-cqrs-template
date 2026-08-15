import { ApiProperty } from '@nestjs/swagger';
import { GetArticleResult } from '../../application/query/get-article-result';
import { ArticleStatus } from '../../article-enum';

/** 단건 응답 body. application의 Result를 interface 계약으로 변환(.of). */
export class ArticleResponseBody {
  @ApiProperty({ example: '9f5f57b0-1111-2222-3333-444455556666' })
  id!: string;

  @ApiProperty({ example: 'author-uuid', description: '작성자 ID' })
  authorId!: string;

  @ApiProperty({ example: '첫 번째 글' })
  title!: string;

  @ApiProperty({ example: '본문 내용입니다.' })
  content!: string;

  @ApiProperty({ enum: ArticleStatus, example: ArticleStatus.DRAFT })
  status!: ArticleStatus;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  static of(result: GetArticleResult): ArticleResponseBody {
    const body = new ArticleResponseBody();
    body.id = result.id;
    body.authorId = result.authorId;
    body.title = result.title;
    body.content = result.content;
    body.status = result.status;
    body.createdAt = result.createdAt;
    return body;
  }
}
