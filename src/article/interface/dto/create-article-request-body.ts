import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateArticleRequestBody {
  @ApiProperty({ example: '첫 번째 글', description: '제목 (1~200자)' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: '본문 내용입니다.', description: '본문' })
  @IsString()
  content!: string;
}
