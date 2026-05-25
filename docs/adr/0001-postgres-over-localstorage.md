# ADR-0001 — Persist runs in Postgres instead of browser localStorage

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo Preflight v1 stored everything — campaigns, runs, blockers — in browser `localStorage`. This was enough for a single-user demo: no infrastructure, instant startup, zero ops cost.

As the project evolved toward an authenticated integration use case, four workflow requirements broke the localStorage model:

1. **Cross-user sharing** — review owners need to inspect the same run result without copy-pasting JSON.
2. **Retained run record** — authenticated integrations need a durable record of submitted bundles, artifact versions, and returned findings; browser `localStorage` can be cleared by a user.
3. **Version history** — campaigns are edited iteratively; operators need to diff v1 vs v3 of a campaign bundle to see which blockers were resolved.
4. **API consumption** — CI/CD pipelines, CRM platforms, and the Telegram outbox worker all need a backend API backed by persistent storage, not a browser tab.

## Decision

Provide two explicitly separate surfaces. The protected REST API persists authenticated integration runs, campaign versions, blockers, outbox events, and the audit log to Postgres. It uses Drizzle ORM for type-safe queries and Drizzle Kit for migrations.

Keep the interactive browser workflow as a synthetic demo that stores its draft, report, version, and tour state in `localStorage`. It does not call the protected API or receive `PREFLIGHT_API_KEY`; there is no browser mode that turns a demo review into a persisted API run.

## Consequences

**Positive**
- Durable history that survives browser clears and multi-user sessions.
- Queryable run and audit records per jurisdiction, per campaign, per run for responsible-owner review.
- Foundation for multi-tenant isolation (adding `org_id` + Row-Level Security later requires no domain changes).
- Enables the outbox pattern: events written to the same DB transaction as the run, delivered atomically.

**Negative**
- Adds an infrastructure dependency: operators must run or provision a Postgres instance.
- Local setup requires `docker-compose up` rather than just `npm run dev`.
- Migrations must be applied before the API starts; the readiness probe (`GET /api/ready`) enforces this.

**Neutral**
- The demo UI and authenticated API demonstrate separate behavior: browser-local usability on one side, durable integration/audit storage on the other.
