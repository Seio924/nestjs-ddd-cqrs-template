/**
 * 도메인 예외 추상 베이스.
 * 예외가 자기 code·status·message를 들고 다니고, 전역 필터가 봉투로 변환한다.
 * 도메인·애플리케이션은 이 계열만 던진다 (plain Error·HttpException 금지, error-handling.md).
 */
export abstract class BaseException extends Error {
  /** 에러 코드 (<DOMAIN>_<REASON> UPPER_SNAKE, 전역 유일) */
  abstract readonly code: string;
  /** HTTP 상태 */
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
