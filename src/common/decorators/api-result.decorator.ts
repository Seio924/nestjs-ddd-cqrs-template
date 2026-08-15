import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '../dto/api-response-dto';

/**
 * 봉투 응답 스웨거 표현: { code, message, result: T }
 * 사용: @ApiResult(GetMyProfileResponseBody)
 */
export const ApiResult = <T extends Type<unknown>>(result: T) =>
  applyDecorators(
    ApiExtraModels(ApiResponseDto, result),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          { properties: { result: { $ref: getSchemaPath(result) } } },
        ],
      },
    }),
  );

/**
 * 오프셋 목록 봉투: result: { <도메인복수형>: item[], count }
 * 응답 키는 도메인 복수형 - 제네릭 키(data/items) 금지 (pagination.md).
 * 사용: @ApiResultList('dailyShares', DailyShareResponseBody)
 */
export const ApiResultList = <T extends Type<unknown>>(key: string, item: T) =>
  applyDecorators(
    ApiExtraModels(ApiResponseDto, item),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              result: {
                type: 'object',
                properties: {
                  [key]: { type: 'array', items: { $ref: getSchemaPath(item) } },
                  count: { type: 'number', example: 42 },
                },
                required: [key, 'count'],
              },
            },
          },
        ],
      },
    }),
  );

/**
 * 커서 목록 봉투(무한스크롤): result: { <도메인복수형>: item[], nextCursor, hasNext }
 * count 없음 - 무한스크롤엔 불필요 (pagination.md).
 * 사용: @ApiResultCursorList('dailyShares', DailyShareResponseBody)
 */
export const ApiResultCursorList = <T extends Type<unknown>>(key: string, item: T) =>
  applyDecorators(
    ApiExtraModels(ApiResponseDto, item),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              result: {
                type: 'object',
                properties: {
                  [key]: { type: 'array', items: { $ref: getSchemaPath(item) } },
                  nextCursor: {
                    type: 'string',
                    nullable: true,
                    example: 'eyJjcmVhdGVkQXQiOiIuLi4iLCJpZCI6Ii4uLiJ9',
                  },
                  hasNext: { type: 'boolean', example: true },
                },
                required: [key, 'nextCursor', 'hasNext'],
              },
            },
          },
        ],
      },
    }),
  );
