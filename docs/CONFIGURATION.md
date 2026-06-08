# Promo Preflight — Configuration

## Required environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://preflight:secret@localhost:5432/preflight` |
| `PREFLIGHT_API_KEY` | Bearer token required for every `/api/v1/*` request. If unset, the protected API rejects all callers. | `<generated-api-key>` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `<telegram-bot-token>` |
| `TELEGRAM_CHAT_ID` | Target channel or chat ID (negative for channels) | `-1001234567890` |

## Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables live free-text AI brief extraction when `USE_MOCK_AI=false`; the default demo uses a labeled synthetic sample extraction. |
| `USE_MOCK_AI` | `false` | Set `true` to short-circuit the Anthropic provider with deterministic stubs. Useful in CI and local dev without a key. |
| `HTTP_PORT` | `3000` | Port the Next.js server listens on. |
| `LOG_LEVEL` | `info` | Log verbosity: `debug` / `info` / `warn` / `error`. |
| `OUTBOX_POLL_INTERVAL_MS` | `1000` | How often the outbox worker polls for undelivered events (milliseconds). |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Protected API rate-limit window length in seconds. |
| `RATE_LIMIT_MAX_REQUESTS` | `20` | Maximum requests per client address during the rate-limit window. |

### Rate limiting on Railway

On Railway public networking, application rate limiting keys requests by the
platform-provided `X-Real-IP` header. Do not change enforcement to use incoming
`X-Forwarded-For`; callers can spoof that header. The in-memory limiter is
process-local and should be replaced by shared infrastructure before scaling
the protected API across multiple instances.

## Example .env

```env
# Required
DATABASE_URL=postgresql://preflight:secret@localhost:5432/preflight
PREFLIGHT_API_KEY=<generated-api-key>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=-1001234567890

# Optional
ANTHROPIC_API_KEY=sk-ant-api03-...
USE_MOCK_AI=false
HTTP_PORT=3000
LOG_LEVEL=info
OUTBOX_POLL_INTERVAL_MS=1000
```

Copy `.env.example` (provided in the repo) and fill in the required values.

## Per-environment notes

**Local development**
- Run the browser UI demo without database setup; its synthetic workflow keeps drafts and reports in browser `localStorage` and never sends `PREFLIGHT_API_KEY`.
- To test the separate protected API flow locally, run `docker-compose up -d` to start Postgres, configure `DATABASE_URL` and `PREFLIGHT_API_KEY`, then send authenticated requests as described in [`docs/API.md`](./API.md).
- Set `USE_MOCK_AI=true` to avoid Anthropic API calls during development.

**docker-compose**
- `DATABASE_URL` is injected automatically via `docker-compose.yml` environment block — no manual edit needed for local docker runs.
- The `worker` service reads the same `DATABASE_URL` and `TELEGRAM_*` vars from the shared `env_file`.

**Production**
- Never commit `.env` to version control. Use your platform's secret manager (Railway environment variables, Render secret files, Kubernetes secrets, etc.).
- Set `PREFLIGHT_API_KEY` in the secret manager before exposing `/api/v1/*`; an unset value fails closed with `401`.
- `OUTBOX_POLL_INTERVAL_MS` can be raised to `5000` in production to reduce DB load; lower to `500` for near-real-time Telegram alerts.
- `LOG_LEVEL=warn` is recommended in production to reduce log volume.
