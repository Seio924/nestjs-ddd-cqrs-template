import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Params } from 'nestjs-pino';
import { Options } from 'pino-http';
import { EnvSchema } from '../../config/env-validation';

export const TRACE_ID_HEADER = 'X-Trace-Id';

/**
 * 요청마다 traceId 부여 (observability.md).
 * 호출자가 X-Trace-Id를 보냈으면 이어받고(분산 추적), 없으면 새로 발급.
 * 응답 헤더에도 노출해 프론트/운영자가 로그를 역추적할 수 있게 한다.
 */
export function assignTraceId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[TRACE_ID_HEADER.toLowerCase()];
  const traceId = typeof incoming === 'string' && incoming ? incoming : randomUUID();
  res.setHeader(TRACE_ID_HEADER, traceId);
  return traceId;
}

/**
 * pino-http 옵션 (구조화 JSON 로깅).
 * - traceId: genReqId로 부여 -> 모든 로그 라인에 req.id로 포함
 * - redact: 민감정보(토큰·쿠키·비밀번호) 마스킹
 * - level: 운영은 info(debug 비활성), 그 외 debug
 */
export function buildPinoHttpOptions(env: EnvSchema): Options {
  return {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    genReqId: assignTraceId,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.accessToken',
        '*.refreshToken',
        '*.token',
      ],
      censor: '[REDACTED]',
    },
  };
}

/** nestjs-pino LoggerModule용 설정 (app-module에서 forRootAsync로 주입) */
export function buildLoggerOptions(env: EnvSchema): Params {
  return { pinoHttp: buildPinoHttpOptions(env) };
}
