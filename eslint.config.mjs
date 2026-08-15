// @ts-check
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

/** 같은 도메인만 허용하는 셀렉터 헬퍼 (from의 도메인 캡처값과 to의 도메인이 일치해야 매칭) */
const sameDomain = (type) => ({
  type,
  captured: { domain: '{{from.element.captured.domain}}' },
});

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // any 금지 (conventions/code-style.md)
      '@typescript-eslint/no-explicit-any': 'error',
      // floating promise 방치 금지 (conventions/code-style.md)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // 아키텍처 경계 강제 (conventions/enforcement.md 초기 3종 + domain 순수성)
    // 1) interface(controller) -> infrastructure(repository 구현) 직접 import 금지
    // 2) repository 구현 -> 남의 도메인 import 금지
    // 3) 도메인 간 내부 파일 직접 import 금지 (남의 application은 adapter 구현에서만)
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.js'] }, // 상대 import를 .ts 파일로 해석 (없으면 경계 판정 불가)
      },
      'boundaries/include': ['src/**/*.ts'],
      'boundaries/elements': [
        // 순서 중요 - 먼저 매칭되는 것이 우선
        { type: 'shared', pattern: 'src/(common|config|database)/**' },
        { type: 'interface', pattern: 'src/*/interface/**', capture: ['domain'] },
        { type: 'application', pattern: 'src/*/application/**', capture: ['domain'] },
        { type: 'domain', pattern: 'src/*/domain/**', capture: ['domain'] },
        { type: 'infrastructure', pattern: 'src/*/infrastructure/**', capture: ['domain'] },
        // 도메인 루트 파일(-module·-exceptions·-error-code·enum·constant)
        { type: 'domain-root', pattern: 'src/*', capture: ['domain'] },
        // src 루트 파일(main.ts, app-module.ts)
        { type: 'root', pattern: 'src' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '레이어/도메인 경계 위반 (.claude/architecture/layer-architecture.md 참조)',
          policies: [
            // 외부 패키지는 경계 규칙 대상 아님 (레이어별 외부 라이브러리 규칙은 리뷰로)
            { allow: { to: { module: { origin: 'external' } } } },
            // 공유(common/config/database)는 공유끼리만
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
            // src 루트(main·app-module)는 배선 지점 - 제한 없음
            { from: { element: { type: 'root' } }, allow: { to: { element: { type: '*' } } } },
            // interface -> 같은 도메인 application/domain/domain-root + 공유 (infra 직통 금지 = 규칙 1)
            {
              from: { element: { type: 'interface' } },
              allow: {
                to: {
                  element: [
                    { type: 'shared' },
                    sameDomain('interface'),
                    sameDomain('application'),
                    sameDomain('domain'),
                    sameDomain('domain-root'),
                  ],
                },
              },
            },
            // application -> 같은 도메인 domain/domain-root + 공유
            {
              from: { element: { type: 'application' } },
              allow: {
                to: {
                  element: [
                    { type: 'shared' },
                    sameDomain('application'),
                    sameDomain('domain'),
                    sameDomain('domain-root'),
                  ],
                },
              },
            },
            // domain은 잎 - 같은 도메인 domain/domain-root + 공유(BaseException·generate-id)만
            {
              from: { element: { type: 'domain' } },
              allow: {
                to: {
                  element: [{ type: 'shared' }, sameDomain('domain'), sameDomain('domain-root')],
                },
              },
            },
            // 도메인 루트 파일 기본(에러·enum·상수) - 공유 + 같은 도메인 루트만
            {
              from: { element: { type: 'domain-root' } },
              allow: {
                to: { element: [{ type: 'shared' }, sameDomain('domain-root')] },
              },
            },
            // 단 -module.ts(배선판)는 자기 도메인 전체 + 남의 도메인 모듈 import 가능
            {
              from: { element: { type: 'domain-root', fileInternalPath: '*-module.ts' } },
              allow: {
                to: {
                  element: [
                    { type: 'shared' },
                    { type: 'domain-root', fileInternalPath: '*-module.ts' },
                    sameDomain('interface'),
                    sameDomain('application'),
                    sameDomain('domain'),
                    sameDomain('infrastructure'),
                    sameDomain('domain-root'),
                  ],
                },
              },
            },
            // infrastructure -> 같은 도메인 전 레이어 + 공유 (남의 도메인 금지 = 규칙 2)
            {
              from: { element: { type: 'infrastructure' } },
              allow: {
                to: {
                  element: [
                    { type: 'shared' },
                    sameDomain('infrastructure'),
                    sameDomain('application'),
                    sameDomain('domain'),
                    sameDomain('domain-root'),
                  ],
                },
              },
            },
            // 단 adapter 구현(-adapter-impl.ts)만 남의 도메인 application(exports된 service)을 감쌀 수 있다 (규칙 3)
            {
              from: {
                element: { type: 'infrastructure', fileInternalPath: '**/*-adapter-impl.ts' },
              },
              allow: {
                to: {
                  element: [
                    { type: 'shared' },
                    { type: 'application' },
                    sameDomain('infrastructure'),
                    sameDomain('domain'),
                    sameDomain('domain-root'),
                  ],
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    // 테스트 파일: supertest 응답 바디 등 any 기반 API가 많아 실용적으로 완화
    files: ['src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
