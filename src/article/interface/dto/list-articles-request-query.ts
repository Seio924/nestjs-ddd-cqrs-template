import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/** 오프셋 페이지네이션 쿼리스트링 (?page=0&take=20) */
export class ListArticlesRequestQuery {
  @ApiPropertyOptional({ example: 0, default: 0, description: '0-based 페이지' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  page: number = 0;

  @ApiPropertyOptional({ example: 20, default: 20, description: '페이지 크기' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  take: number = 20;
}
