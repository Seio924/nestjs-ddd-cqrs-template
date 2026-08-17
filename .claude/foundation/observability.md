# 로깅 & 보안

## 로깅

- **nestjs-pino** 구조화 JSON 로깅. 요청마다 `traceId` 부여(응답 헤더에도 노출).
- 레벨 규칙:
  | 레벨 | 용도 |
  |---|---|
  | `error` | 미처리 예외(500), 외부 연동 실패 |
  | `warn` | 보안 관련 도메인 예외, 비정상 입력 |
  | `info` | 요청 완료(메서드·경로·status·소요시간), 주요 상태변경 |
  | `debug` | 개발용 상세(운영 비활성) |
- 🔴 민감정보(비밀번호·토큰 등)는 **로그 마스킹**. pino `redact` 설정.

---

## 보안

- `helmet` 적용(보안 헤더 + X-Powered-By 제거).
- CORS: `WEB_ORIGIN`(env)만 허용, `credentials: true`.
- 전역 rate limit(`@nestjs/throttler`) — auth 등 민감 엔드포인트에 우선 적용(브루트포스 방어).
