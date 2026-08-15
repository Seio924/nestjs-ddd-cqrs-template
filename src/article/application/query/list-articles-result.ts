import { ArticleStatus } from '../../article-enum';

/** 목록 아이템 (본문 제외 — 목록엔 불필요) */
export class ListArticlesItem {
  id!: string;
  authorId!: string;
  title!: string;
  status!: ArticleStatus;
  createdAt!: Date;
}

export class ListArticlesResult {
  articles!: ListArticlesItem[];
  count!: number;
}
