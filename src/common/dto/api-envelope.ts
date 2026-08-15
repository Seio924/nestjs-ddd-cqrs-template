/**
 * 응답 봉투 - 성공·실패 동일 껍데기 (design-principles.md §8).
 * 성공: { code: 'SUCCESS', message, result: 데이터 }
 * 실패: { code: '<DOMAIN>_<REASON>', message, result: null }
 */
export interface ApiEnvelope<T> {
  code: string;
  message: string;
  result: T;
}
