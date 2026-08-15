import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvSchema } from '../../config/env-validation';
import { AuthUser } from './auth-user';
import { TokenPayload } from './token-payload';

/**
 * access 토큰 검증 전략 (stateless - 서명·만료만 검증, DB 조회 없음).
 * Authorization: Bearer 헤더에서 토큰을 읽는다.
 * validate 반환값이 req.user가 되어 @CurrentUser()로 주입된다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(env: EnvSchema) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_ACCESS_SECRET,
    });
  }

  validate(payload: TokenPayload): AuthUser {
    return { userId: payload.sub };
  }
}
