# Promo Preflight — Configuration

## Required environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://preflight:secret@localhost:5432/preflight` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | `<telegram-bot-token>` |
| `TELEGRAM_CHAT_ID` | Target channel or chat ID (negative for channels) | `-1001234567890` |

## Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables AI augmentation features. Without it, AI calls fall back to deterministic-only mode. |
| `USE_MOCK_AI` | `false` | Set `true` to short-circuit the Anthropic provider with deterministic stubs. Useful in CI and local dev without a key. |
| `HTTP_PORT` | `3000` | Port the Next.js server listens on. |
| `LOG_LEVEL` | `info` | Log verbosity: `debug` / `info` / `warn` / `error`. |
| `PREFLIGHT_MODE` | `localStorage` | `localStorage` — client-side demo mode (no backend required). `server` — uses the Postgres-backed API. |
| `OUTBOX_POLL_INTERVAL_MS` | `1000` | How often the outbox worker polls for undelivered events (milliseconds). |

## Example .env

```env
# Required
DATABASE_URL=postgresql://preflight:secret@localhost:5432/preflight
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=-1001234567890

# Optional
ANTHROPIC_API_KEY=sk-ant-api03-...
USE_MOCK_AI=false
HTTP_PORT=3000
LOG_LEVEL=info
PREFLIGHT_MODE=server
OUTBOX_POLL_INTERVAL_MS=1000
```

Copy `.env.example` (provided in the repo) and fill in the required values.

## Per-environment notes

**Local development**
- Use `PREFLIGHT_MODE=localStorage` to skip the database entirely and run the UI demo.
- To test the full API flow locally, run `docker-compose up -d` to start Postgres, then set `PREFLIGHT_MODE=server` and `DATABASE_URL` pointing to the container.
- Set `USE_MOCK_AI=true` to avoid Anthropic API calls during development.

**docker-compose**
- `DATABASE_URL` is injected automatically via `docker-compose.yml` environment block — no manual edit needed for local docker runs.
- The `worker` service reads the same `DATABASE_URL` and `TELEGRAM_*` vars from the shared `env_file`.

**Production**
- Never commit `.env` to version control. Use your platform's secret manager (Railway environment variables, Render secret files, Kubernetes secrets, etc.).
- `OUTBOX_POLL_INTERVAL_MS` can be raised to `5000` in production to reduce DB load; lower to `500` for near-real-time Telegram alerts.
- `LOG_LEVEL=warn` is recommended in production to reduce log volume.
