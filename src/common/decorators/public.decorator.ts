import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 엔드포인트 표시.
 * 전역 JwtAuthGuard가 기본으로 모든 라우트를 막고, 이 데코레이터가 붙은 것만
 * 인증 없이 연다(안전한 기본값 - 실수로 열리는 방향이 아니라 실수로 막히는 방향).
 */
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);
