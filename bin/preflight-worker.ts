#!/usr/bin/env tsx

import { createAuditSubscriber } from '../infrastructure/audit';
import { getDb } from '../infrastructure/db/client';
import { OutboxWorker } from '../infrastructure/outbox';
import { PgAuditRepository } from '../infrastructure/persistence/PgAuditRepository';
import { telegramSubscriber } from '../infrastructure/telegram';

const pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1000);
const maxAttempts = 5;

const db = getDb();
const auditRepository = new PgAuditRepository(db);
const auditSubscriber = createAuditSubscriber(auditRepository);

// Order matters: the worker delivers subscribers sequentially and a throw in
// any one triggers redelivery of the whole event. The audit log is the
// durable record and must run before the best-effort Telegram notifier, so a
// transient Telegram failure can never starve audit_log. Keep in lockstep
// with instrumentation.ts.
const worker = new OutboxWorker(db, [auditSubscriber, telegramSubscriber], {
  pollIntervalMs,
  maxAttempts,
});

const shutdown = (): void => {
  void worker.stop();
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

await worker.start();
