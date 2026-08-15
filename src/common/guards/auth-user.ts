/** 전역 가드를 통과한 인증 유저 (@CurrentUser()로 주입받는 형태) */
export interface AuthUser {
  userId: string;
}
