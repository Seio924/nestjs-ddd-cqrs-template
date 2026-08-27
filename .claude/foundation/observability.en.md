> 🌐 [한국어](./observability.md) · **English**

# Logging & Security

## Logging

- **nestjs-pino** structured JSON logging. Assign a `traceId` per request (also exposed in the response header).
- Level rules:
  | Level | Purpose |
  |---|---|
  | `error` | Unhandled exceptions (500), external integration failures |
  | `warn` | Security-related domain exceptions, abnormal input |
  | `info` | Request completion (method·path·status·elapsed time), major state changes |
  | `debug` | Detailed dev logging (disabled in production) |
- 🔴 Sensitive data (passwords·tokens, etc.) is **masked in logs**. Configure pino `redact`.

---

## Security

- Apply `helmet` (security headers + removing X-Powered-By).
- CORS: allow only `WEB_ORIGIN` (env), `credentials: true`.
- Global rate limit (`@nestjs/throttler`) — applied first to sensitive endpoints such as auth (brute-force defense).
