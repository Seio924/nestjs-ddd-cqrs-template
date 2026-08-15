import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../guards/auth-user';

/** 인증 유저 주입 (수동 req.user 접근 지양 - foundation/auth.md) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
