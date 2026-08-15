import { plainToInstance } from 'class-transformer';
import { IsIn, IsNumber, IsString, validateSync } from 'class-validator';

/** 서버 기본 포트 */
const DEFAULT_PORT = 4000;

/**
 * 환경변수 스키마 = 검증 규칙 + 타입.
 * 검증을 통과한 "이 클래스의 인스턴스"가 DI로 주입돼, 앱 코드는 `env.PORT`처럼
 * 타입 안전하게 접근한다(문자열 키 없음 — 오타는 컴파일 에러).
 * 새 변수는 그걸 실제로 쓰는 곳에서 추가한다 (DATABASE_URL=DB, WEB_ORIGIN=CORS, JWT_*=인증).
 */
export class EnvSchema {
  /** 실행 환경 - 로그 레벨(운영은 debug 비활성) 등 환경 분기에 사용 */
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsNumber()
  PORT: number = DEFAULT_PORT; // 없으면 기본값, 있으면 숫자 검증

  /** MySQL 접속 URL. 예: mysql://user:password@host:3306/app */
  @IsString()
  DATABASE_URL!: string; // 필수 - 없으면 기동 실패

  /** CORS 허용 웹 오리진 (콤마 구분 다중). 예: https://example.com,https://dev.example.com */
  @IsString()
  WEB_ORIGIN!: string; // 필수 - 없으면 기동 실패

  /** access JWT 서명 시크릿 (인증을 붙일 때 refresh 시크릿 등은 여기 추가) */
  @IsString()
  JWT_ACCESS_SECRET!: string; // 필수 - 없으면 기동 실패

  /** 파싱된 CORS 오리진 목록 (검증된 인스턴스에서 바로 사용) */
  get webOrigins(): string[] {
    return this.WEB_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}

let validatedEnv: EnvSchema | undefined;

/**
 * 부팅 시 ConfigModule이 호출. 형식 오류가 하나라도 있으면 기동 실패시킨다(fail-fast).
 * 결과 인스턴스는 EnvSchema 프로바이더(app-module)가 그대로 주입에 쓴다.
 */
export function validateEnv(config: Record<string, unknown>): EnvSchema {
  const validated = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true, // "4000" 같은 문자열을 스키마 타입(number)으로 변환
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`환경변수 검증 실패:\n${errors.toString()}`);
  }
  validatedEnv = validated;
  return validated;
}

/** 검증 완료된 EnvSchema 인스턴스 (DI 프로바이더용) */
export function getValidatedEnv(): EnvSchema {
  if (!validatedEnv) {
    throw new Error(
      '환경변수가 아직 검증되지 않았습니다 (ConfigModule.forRoot가 먼저 실행돼야 함)',
    );
  }
  return validatedEnv;
}
