/** 목록 조회 입력 - 오프셋 페이지네이션 (page: 0-based, take: 크기) */
export interface ListArticlesQuery {
  page: number;
  take: number;
}
