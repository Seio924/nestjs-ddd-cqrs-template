import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUnauthorizedException } from '../exceptions/common-exceptions';
import { AuthUser } from './auth-user';

/**
 * 전역 인증 가드. 모든 라우트는 기본적으로 인증 필요, @Public()만 예외.
 * 실패 시 passport 기본 UnauthorizedException 대신 도메인 예외를 던져
 * 전역 필터가 401 + AUTH_UNAUTHORIZED 봉투로 변환하게 한다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 핸들러(메서드) 또는 클래스(컨트롤러)에 @Public()이 붙었으면 인증 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  override handleRequest<TUser = AuthUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) throw new AuthUnauthorizedException();
    return user;
  }
}
