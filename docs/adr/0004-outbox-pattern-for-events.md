# ADR-0004 — Outbox pattern for at-least-once event delivery

**Status**: Accepted
**Date**: 2026-05-16

## Context

When a run completes, Preflight publishes `PreflightEvent`s (`RunCompleted`, `BlockerRaised`, etc.) to subscribers: Telegram notifications, the audit log, and future adapters (Slack, Jira, Linear). Two naive approaches both have fatal failure modes:

**Publish before DB commit** — if the DB commit subsequently fails, subscribers receive events for a run that never persisted. These are phantom events.

**Publish after DB commit (in the same request handler)** — if the publish fails (network error, Telegram API down, broker outage), the run is persisted but the events are silently lost. Operators get no Telegram alert.

Either failure mode produces a compliance process gap: operators assume events are delivered reliably, and build workflows (Telegram-based owner assignment, audit entries) on that assumption.

## Decision

Use the transactional outbox pattern:

1. During the run, the use case writes `PreflightEvent` rows to an `outbox` table inside the **same database transaction** as the run insert. If the transaction rolls back, events are rolled back too — no phantom events.
2. A background `OutboxWorker` polls the `outbox` table for rows with `delivered_at IS NULL`.
3. For each undelivered row, the worker calls each registered `IHandoffAdapter` (Telegram, audit log, etc.) and marks the row `delivered_at = now()` on success.
4. If a subscriber call fails, the row is retried on the next poll cycle. Delivery is at-least-once.
5. Subscribers must be idempotent, keyed on `event_id`.

Poll interval is configurable via `OUTBOX_POLL_INTERVAL_MS` (default 1000ms).

## Consequences

**Positive**
- No phantom events: event rows only exist if the run exists in the same DB transaction.
- No lost events: undelivered rows are retried until they succeed.
- Audit-friendly: the outbox table is a durable event log, queryable per run or per jurisdiction.
- Decoupled: adding a new subscriber (Slack, Jira) requires no changes to the run use case — only a new `IHandoffAdapter` implementation.

**Negative**
- Small delivery delay: events are delivered after the next poll cycle, not within the same request (default ~1 second lag).
- The outbox table grows unboundedly — periodic cleanup (`DELETE WHERE delivered_at < now() - interval '30 days'`) is required in production.
- The outbox worker is a separate process entrypoint (`npm run worker`) that must be kept alive.

**Neutral**
- Subscribers must be idempotent by design. The Telegram adapter checks `event_id` before sending to avoid duplicate messages on retries.
