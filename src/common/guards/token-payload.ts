/**
 * access JWT payload 형태.
 * 발급 정책(뭘 담을지)은 auth 도메인 application이 소유하고, 여기선 형태만 공유한다
 * (가드가 검증할 때와 auth가 서명할 때 같은 모양을 봐야 하므로 common에 위치).
 */
export interface TokenPayload {
  /** 유저 id (JWT 표준 subject 클레임) */
  sub: string;
}
