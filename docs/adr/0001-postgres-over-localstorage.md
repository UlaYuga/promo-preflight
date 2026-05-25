# ADR-0001 — Persist runs in Postgres instead of browser localStorage

**Status**: Accepted
**Date**: 2026-05-16

## Context

Promo Preflight v1 stored everything — campaigns, runs, blockers — in browser `localStorage`. This was enough for a single-user demo: no infrastructure, instant startup, zero ops cost.

As the project evolved toward a real operator use case, four requirements broke the localStorage model:

1. **Cross-user sharing** — a compliance officer and a promo manager must both see the same run result without copy-pasting JSON.
2. **Audit log** — regulators expect a durable, tamper-evident record of "we checked this campaign before launch." localStorage is cleared by users and not court-admissible.
3. **Version history** — campaigns are edited iteratively; operators need to diff v1 vs v3 of a campaign bundle to see which blockers were resolved.
4. **API consumption** — CI/CD pipelines, CRM platforms, and the Telegram outbox worker all need a backend API backed by persistent storage, not a browser tab.

## Decision

Provide two explicitly separate surfaces. The protected REST API persists authenticated integration runs, campaign versions, blockers, outbox events, and the audit log to Postgres. It uses Drizzle ORM for type-safe queries and Drizzle Kit for migrations.

Keep the interactive browser workflow as a synthetic demo that stores its draft, report, version, and tour state in `localStorage`. It does not call the protected API or receive `PREFLIGHT_API_KEY`; there is no browser mode that turns a demo review into a persisted API run.

## Consequences

**Positive**
- Durable history that survives browser clears and multi-user sessions.
- Queryable audit log per jurisdiction, per campaign, per run — suitable for showing to a regulator.
- Foundation for multi-tenant isolation (adding `org_id` + Row-Level Security later requires no domain changes).
- Enables the outbox pattern: events written to the same DB transaction as the run, delivered atomically.

**Negative**
- Adds an infrastructure dependency: operators must run or provision a Postgres instance.
- Local setup requires `docker-compose up` rather than just `npm run dev`.
- Migrations must be applied before the API starts; the readiness probe (`GET /api/ready`) enforces this.

**Neutral**
- The demo UI and authenticated API provide separate evidence: browser-local usability on one side, durable integration/audit behavior on the other.
