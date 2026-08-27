import { ArticleStatus } from '../../../article-enum';

/** 단건 조회 결과 (화면 모양 DTO, 애그리거트 안 거침 — application 소유) */
export class GetArticleResult {
  id!: string;
  authorId!: string;
  title!: string;
  content!: string;
  status!: ArticleStatus;
  createdAt!: Date;
}
