import { ValidationError, ValidationPipe } from '@nestjs/common';
import { FieldValidationError, ValidationException } from '../exceptions/common-exceptions';

/**
 * class-validator의 ValidationError 트리(중첩 DTO는 children으로 옴)를
 * 평평한 [{ field, rules }] 목록으로 변환한다.
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldValidationError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, rules: Object.keys(error.constraints) }] : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/**
 * 전역 검증 파이프.
 * - whitelist + forbidNonWhitelisted: 스키마에 없는 필드는 조용히 버리지 않고 에러 (오타 즉시 발견)
 * - transform: 쿼리스트링 등 문자열 입력을 DTO 타입으로 변환
 * - exceptionFactory: Nest 기본 BadRequestException(영어 문장 배열) 대신
 *   우리 도메인 예외(ValidationException)를 던져 필드+규칙 코드로 구조화
 */
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new ValidationException(flattenValidationErrors(errors)),
    });
  }
}
