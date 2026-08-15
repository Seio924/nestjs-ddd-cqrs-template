import { getValidatedEnv, validateEnv } from './env-validation';

/** 필수 값만 채운 최소 유효 env */
const VALID_ENV = {
  DATABASE_URL: 'mysql://user:pass@localhost:3306/app',
  WEB_ORIGIN: 'https://example.com,https://dev.example.com',
  JWT_ACCESS_SECRET: 'test-access-secret',
};

describe('validateEnv', () => {
  it('필수 값이 있으면 통과하고, PORT가 없으면 기본값 4000을 채운다', () => {
    const env = validateEnv(VALID_ENV);

    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
  });

  it('PORT가 숫자 문자열이면 number로 변환해 반환한다', () => {
    const env = validateEnv({ ...VALID_ENV, PORT: '4100' });

    expect(env.PORT).toBe(4100);
  });

  it('PORT가 숫자가 아니면 기동 실패시킨다(throw)', () => {
    expect(() => validateEnv({ ...VALID_ENV, PORT: 'abc' })).toThrow('환경변수 검증 실패');
  });

  it('필수 값(DATABASE_URL·WEB_ORIGIN·JWT_ACCESS_SECRET)이 없으면 기동 실패시킨다(throw)', () => {
    expect(() => validateEnv({})).toThrow('환경변수 검증 실패');
    expect(() => validateEnv({ DATABASE_URL: 'mysql://x' })).toThrow('환경변수 검증 실패');
    expect(() => validateEnv({ DATABASE_URL: 'mysql://x', WEB_ORIGIN: 'https://a.com' })).toThrow(
      '환경변수 검증 실패',
    );
  });

  it('webOrigins는 콤마 구분 WEB_ORIGIN을 목록으로 파싱한다(공백 무시)', () => {
    const env = validateEnv({ ...VALID_ENV, WEB_ORIGIN: 'https://a.com, https://b.com,' });

    expect(env.webOrigins).toEqual(['https://a.com', 'https://b.com']);
  });
});

describe('getValidatedEnv', () => {
  it('validateEnv가 반환한 것과 같은 인스턴스를 돌려준다(DI 프로바이더용)', () => {
    const validated = validateEnv(VALID_ENV);

    expect(getValidatedEnv()).toBe(validated);
  });
});
