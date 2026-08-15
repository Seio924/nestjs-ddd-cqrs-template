import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleResponseBody {
  @ApiProperty({ example: '9f5f57b0-1111-2222-3333-444455556666', description: '생성된 게시글 ID' })
  id!: string;
}
