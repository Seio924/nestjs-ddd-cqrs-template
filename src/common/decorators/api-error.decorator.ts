import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { BaseException } from '../exceptions/base-exception';

/**
 * 도메인 예외에서 에러 응답 문서 자동 추출.
 * 예외가 code·status·message를 스스로 들고 있어서(BaseException),
 * 인스턴스를 만들어 읽기만 하면 문서가 된다 - 에러 문서를 손으로 안 씀 (api-docs.md).
 * 사용: @ApiErrors(UserNotFoundException, AuthUnauthorizedException)
 */
export const ApiErrors = (...exceptions: Array<new () => BaseException>) =>
  applyDecorators(
    ...exceptions.map((ExceptionClass) => {
      const e = new ExceptionClass();
      return ApiResponse({ status: e.status, description: `${e.code} - ${e.message}` });
    }),
  );
