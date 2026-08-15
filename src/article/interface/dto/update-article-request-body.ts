import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateArticleRequestBody {
  @ApiProperty({ example: '수정된 제목', description: '제목 (1~200자)' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: '수정된 본문', description: '본문' })
  @IsString()
  content!: string;
}
