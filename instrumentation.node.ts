import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { createAuditSubscriber } from "@infra/audit";
import { getDb } from "@infra/db/client";
import { OutboxWorker } from "@infra/outbox";
import { PgAuditRepository } from "@infra/persistence/PgAuditRepository";
import { telegramSubscriber } from "@infra/telegram";

// Runs once when the server process starts (Next.js instrumentation hook).
// Two responsibilities, both reasons live here (not in a separate process)
// because Next standalone trims `pg`/`drizzle-orm` from node_modules — only
// the Next bundle resolves them:
//
//   1. Apply db/migrations/*.sql so the production schema is never behind the
//      deployed code. The generated SQL uses `create table if not exists`, so
//      re-running on every boot is safe and idempotent. A failure is logged
//      but does not crash the server — /api/ready then truthfully reports the
//      missing tables.
//
//   2. Start the outbox worker so events written to `outbox` inside POST
//      /api/v1/runs (RunStarted / BlockerRaised / RunCompleted) actually
//      reach `audit_log` and downstream subscribers (Telegram). Without this,
//      events accumulate silently and GET /api/v1/audit returns 200 with an
//      empty list — a silent data-pipeline gap. The worker uses
//      `for update skip locked` so multiple containers stay safe.

let outboxWorkerRef: { stop(): Promise<void> } | null = null;
let shutdownHandlersBound = false;

export async function registerNodeInstrumentation(): Promise<void> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.warn("[migrate] DATABASE_URL not set — skipping migrations.");
    return;
  }

  const migrationsOk = await applyMigrations();
  if (!migrationsOk) {
    console.warn("[outbox] migrations did not complete — skipping worker boot.");
    return;
  }

  startOutboxWorker();
}

async function applyMigrations(): Promise<boolean> {
  try {
    const db = getDb();
    const dir = "db/migrations";
    const files = (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const text = await readFile(join(dir, file), "utf8");
      if (text.trim().length === 0) continue;
      await db.execute(sql.raw(text));
      console.log(`[migrate] applied ${file}`);
    }

    console.log("[migrate] schema up to date.");
    return true;
  } catch (err) {
    console.error(
      "[migrate] migration failed; server will still start and /api/ready will report status:",
      err
    );
    return false;
  }
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
