import { createAuditSubscriber } from "@infra/audit";
import { getDb } from "@infra/db/client";
import { OutboxWorker } from "@infra/outbox";
import { PgAuditRepository } from "@infra/persistence/PgAuditRepository";
import { telegramSubscriber } from "@infra/telegram";

// Runs once when the server process starts (Next.js instrumentation hook).
// This hook owns the in-process outbox worker only. Database migrations run
// through Railway's pre-deploy command before a new server image is started.
// Events written to `outbox` inside POST /api/v1/runs (RunStarted /
// BlockerRaised / RunCompleted) must reach `audit_log` and downstream
// subscribers (Telegram). The worker uses `for update skip locked` so
// multiple containers stay safe.

let outboxWorkerRef: { stop(): Promise<void> } | null = null;
let shutdownHandlersBound = false;

export async function registerNodeInstrumentation(): Promise<void> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.warn("[outbox] DATABASE_URL not set - skipping worker startup.");
    return;
  }

  startOutboxWorker();
}

function startOutboxWorker(): void {
  try {
    const db = getDb();
    const auditRepository = new PgAuditRepository(db);
    const auditSubscriber = createAuditSubscriber(auditRepository);

    const worker = new OutboxWorker(
      db,
      [auditSubscriber, telegramSubscriber],
      {
        pollIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1000),
        maxAttempts: 5,
      }
    );

    outboxWorkerRef = worker;

    if (!shutdownHandlersBound) {
      const shutdown = (): void => {
        if (outboxWorkerRef) {
          void outboxWorkerRef.stop();
        }
      };
      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);
      shutdownHandlersBound = true;
    }

    // Fire-and-forget: start() returns the loop promise that resolves on stop().
    void worker.start().catch((err) => {
      console.error("[outbox] worker loop exited with error:", err);
    });

    console.log("[outbox] worker started.");
  } catch (err) {
    console.error(
      "[outbox] failed to start worker; events will queue in outbox until next boot:",
      err
    );
  }
}
