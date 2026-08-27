/** 생성 유스케이스 입력 (interface DTO와 분리 — application은 interface를 모른다) */
export interface CreateArticleCommand {
  authorId: string;
  title: string;
  content: string;
}
