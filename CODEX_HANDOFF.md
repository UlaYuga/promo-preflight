# Codex Handoff Report — Current Product State

**Date:** 2026-05-18
**Branch:** main
**Production:** <https://promo-preflight-production.up.railway.app/>
**Status:** Live on Railway. Browser-local synthetic demo plus a separate authenticated REST API with Postgres persistence and outbox→audit evidence. Portfolio-grade, single-tenant.

## What Is Implemented

### Product surface

- Next.js 16 App Router workspace with welcome page, EN/RU UI, Driver.js desktop tour (8 steps).
- Campaign intake form with metadata, offer basics, assets, links, terms, owners, worked examples, validation, browser draft persistence, double-click guard on Save (T-065).
- Offline deterministic check runner — 8 check modules against 23 versioned YAML rules. Same input → same verdict.
- Risk Report screen with saved / sample state badge, issue table, evidence, owner suggestions, Markdown / Slack / clipboard export.
- Launch Readiness screen with Go / No-Go, owner matrix, blockers, dependencies, checklist.
- Handoff screen with Slack-style preview, Markdown download, tone / mention / channel controls, launch date, sample-state badge (T-060).
- Campaign workspace: local campaign list, per-campaign versions, owner overrides (sanitized + persisted), version-to-version blocker diff.
- Run detail screen at `/app/runs/[id]`; legacy `/runs/[id]` redirects (307) for already-sent Telegram alerts (codex #18).
- Rules and Owners screens backed by `rules/rules.yaml` and `config/owners.yaml`.

### REST API (`docs/API.md`)

Versioned under `/api/v1/`. This is an authenticated integration surface separate from the localStorage-backed browser demo; all versioned endpoints require `Authorization: Bearer <PREFLIGHT_API_KEY>`. Single canonical request shape; response shapes documented to match implementation (T-059).

- `POST /api/v1/runs` — runs all enabled checks, persists, returns `{runId, campaignId, campaignVersion, verdict, status, counts, blockers, createdAt, completedAt, policyRuleVersions}`. Requires `Idempotency-Key` header. Same key + same body → same persisted response snapshot; same key + different body → `409 IDEMPOTENCY_CONFLICT`.
- `GET /api/v1/runs/:id` — same shape as POST, including persisted `policyRuleVersions`. Non-UUID id → 404.
- `GET /api/v1/campaigns`, `GET /api/v1/campaigns/:id`, `GET /api/v1/campaigns/:id/versions`, `GET /api/v1/campaigns/:id/diff?from=&to=` — read-side endpoints. Versions include the run's persisted `policyRuleVersions` when a run is attached.
- `GET /api/v1/audit?type=&limit=&cursor=` — paginated event log.
- `GET /api/health`, `GET /api/ready` — liveness and readiness probes (the latter reads env, database connectivity, and required migrated tables; it does not apply migrations).

### Persistence and pipeline

- PostgreSQL via Drizzle ORM + `pg`. Railway runs `node db/migrate.mjs` as a pre-deploy command from the final Docker image, applying pending artifacts from the existing Drizzle migration journal and recording them in `drizzle.__drizzle_migrations` before the web process starts; failure blocks deployment.
- Idempotent run persistence inside a single transaction: claim the idempotency slot via `INSERT ... ON CONFLICT DO NOTHING`, then find-or-create campaign, then create version, then write run + blockers + `policy_rule_versions_json`. Concurrent transactions for the same `{campaignName, operatorLabel}` are serialized with `pg_advisory_xact_lock(hashtextextended(...))` to prevent duplicate campaign rows (T-061).
- Transactional outbox: domain events (`RunStarted`, `BlockerRaised`, `RunCompleted`) are inserted into `outbox` in the same transaction as the run. The outbox worker remains an in-process runtime responsibility of `instrumentation.node.ts` when `DATABASE_URL` is configured (T-062), drains the queue with `FOR UPDATE SKIP LOCKED`, and delivers to two subscribers in order `[audit, telegram]` so the durable sink runs before the best-effort notifier (T-064).
- Audit append is idempotent on `event.id` (T-063) — a redelivery on worker crash or Railway redeploy mid-batch never produces a duplicate `audit_log` row.

### Notifications

- Telegram alerts via outbox subscriber. Run-link base URL is driven by `PUBLIC_APP_URL` (T-067); without it the adapter falls back to `localhost` (correct for dev, wrong for prod — was the source of broken prod alerts).
- Adapter is a no-op when `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` is unset.

### Deploy

- Railway service `promo-preflight` (project `perceptive-perfection`). Sibling Postgres service in the same project. Region `sfo`.
- Build via **Dockerfile** (`railway.toml` declares `builder = "DOCKERFILE"`); start command is `node server.js` from the standalone bundle. Not `npm run start` / `next start` (that path crashed prod with `sh: next: not found` — T-051).
- Before start, `[deploy].preDeployCommand = "node db/migrate.mjs"` runs in the final image; its non-zero exit status blocks the Railway deployment.
- Auto-redeploy on every push to `main` (~3–6 min Docker build).
- `noindex` metadata + disallow-all `robots.ts`.

### CI

- GitHub Actions `.github/workflows/ci.yml` on Node 22 with a Postgres 16 service.
- Quality gates per PR: typecheck, lint, schema check, db migrate, db check, vitest (202 tests / 35 files), rules check, owners check, i18n parity, versioning check, AI check, checks regression smoke. Docker build runs in a separate job.
- Action versions kept current: `actions/checkout@v5`, `actions/setup-node@v5`, `docker/setup-buildx-action@v4` (T-068).

## What Is Not Implemented

- No end-user auth/accounts, billing, SaaS onboarding, or payments. The protected `/api/v1/*` integration surface does enforce bearer authentication.
- No durable campaign persistence in the running **UI**; saved reports, campaigns, owner overrides, and tour state use `localStorage`. The REST API persists to Postgres separately — these are two different stores by design.
- No live LLM call in the default check path; Anthropic provider wiring exists for the planned augmentation roadmap (ADR-0005).
- No raw campaign / T&C storage by default (`STORE_RAW_INPUT=false`).
- No player-facing gambling journey, operator logos, affiliate funnel, or casino visual positioning.

## Current Source Of Truth

- Public-facing project description: `README.md`.
- API contract: `docs/API.md` (matches implementation as of T-059).
- Architecture overview: `docs/ARCHITECTURE.md`.
- Case study: `docs/CASE-STUDY.md`.
- ADRs: `docs/adr/` (0001–0005). ADR-0004 documents the outbox pattern and the at-least-once → idempotent-sink contract (T-063).
- Production URL and app metadata: `app/layout.tsx`.
- Commands and package metadata: `package.json`.
- Rules artifact: `rules/rules.yaml` (23 rules).
- Owner config: `config/owners.yaml`.
- Database schema: `infrastructure/db/schema.ts` (Drizzle); migrations: `db/migrations/`.

## Environment

Required:

- `DATABASE_URL` — Postgres connection string.
- `PREFLIGHT_API_KEY` — server-side bearer key required for `/api/v1/*`; it is never sent to the browser demo.

Recommended:

- `PUBLIC_APP_URL` — absolute origin used in Telegram run-link alerts (defaults to `localhost` if unset).
- `OUTBOX_POLL_INTERVAL_MS` — outbox worker poll cadence (default 1000ms).

Optional:

- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — enables the Telegram notifier; both unset is a clean no-op.
- `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL_*` — reserved for the AI augmentation roadmap; not used in the default check path.

See `.env.example` for the full list with comments.

## Recommended Verification

Run before claiming release readiness:

```bash
npm run typecheck
npm run lint
npm test
npm run schema:check
npm run checks:run
npm run versioning:check
npm run rules:check
npm run owners:check
npm run i18n:check
npm run ai:check
npm run build
```

Run `npm run db:check` only when `DATABASE_URL` points to a reachable Postgres database. Run `npm run cleanup:test-data` (dry-run by default; `--apply` to delete) to remove synthetic `QA-RACE-*` / `VERIFY-FIX-*` campaigns left by race / idempotency stress tests.

Production smoke (one-liners):

```bash
B=https://promo-preflight-production.up.railway.app
curl -s $B/api/health        # {"status":"ok"}
curl -s $B/api/ready         # {"status":"ok","checks":{"env":"ok","db":"ok","migrations":"ok"}}
KEY=$(uuidgen)
curl -s -X POST $B/api/v1/runs -H "Authorization: Bearer $PREFLIGHT_API_KEY" -H 'Content-Type: application/json' -H "Idempotency-Key: $KEY" -d @bundle.json
sleep 2
curl -s "$B/api/v1/audit?limit=10" -H "Authorization: Bearer $PREFLIGHT_API_KEY"   # event types RunStarted / BlockerRaised / RunCompleted
```
