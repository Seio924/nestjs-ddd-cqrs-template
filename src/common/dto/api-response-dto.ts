import { ApiProperty } from '@nestjs/swagger';

/**
 * 봉투의 스웨거 표현용 클래스.
 * 그냥 두면 스웨거가 result를 any로 뱉어 프론트가 타입을 못 받는다.
 * ApiResult 계열 데코레이터가 result 자리에 실제 응답 타입을 주입한다 (api-docs.md).
 * (런타임 봉투 타입은 dto/api-envelope.ts의 interface - 이 클래스는 문서 생성 전용)
 */
export class ApiResponseDto<T> {
  @ApiProperty({ example: 'SUCCESS' })
  code!: string;

  @ApiProperty({ example: '요청 성공' })
  message!: string;

  result!: T;
}
