import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { Client } from 'pg';
import { POST as postRun } from '../app/api/v1/runs/route';
import { createAuditSubscriber } from '../infrastructure/audit';
import { getDb } from '../infrastructure/db/client';
import { OutboxWorker } from '../infrastructure/outbox';
import { PgAuditRepository } from '../infrastructure/persistence/PgAuditRepository';
import { telegramSubscriber } from '../infrastructure/telegram';
import type { CampaignBundleInput } from '../schemas';
import { applyDbMigrations } from './db-smoke-helpers';

type OutboxSummaryRow = {
  total: string;
  delivered: string;
};

type AuditSummaryRow = {
  total: string;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for smoke:worker');
}

const smokeFixture: CampaignBundleInput = {
  metadata: {
    campaignName: 'Smoke worker campaign',
    promoType: 'welcome',
    geo: 'UK',
    locale: 'en-GB',
    currency: 'GBP',
    channelsIncluded: ['email', 'landing'],
  },
  offer: {
    bonusPercentage: 100,
    maxBonus: 250,
    wageringRequirement: '35x bonus',
    maxBet: 5,
  },
  targetJurisdiction: ['UK'],
  paymentMethods: ['credit_card'],
  termsText: 'Risk-free promo. 18+ BeGambleAware.org. Wagering 35x applies.',
  assets: [],
  links: [],
  owners: [],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareDb(client: Client): Promise<void> {
  await applyDbMigrations(client);
  await client.query(`
    truncate table
      audit_log,
      outbox,
      run_blockers,
      runs,
      campaign_versions,
      campaigns,
      idempotency_keys
    restart identity cascade
  `);
}

async function fetchOutboxSummary(client: Client, runId: string): Promise<{ total: number; delivered: number }> {
  const result = await client.query<OutboxSummaryRow>(
    `
    select
      count(*)::text as total,
      count(*) filter (where delivered_at is not null)::text as delivered
    from outbox
    where payload->>'runId' = $1
    `,
    [runId]
  );

  const row = result.rows[0];
  return {
    total: Number(row?.total ?? '0'),
    delivered: Number(row?.delivered ?? '0'),
  };
}

async function waitForDelivery(client: Client, runId: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const summary = await fetchOutboxSummary(client, runId);
    if (summary.total > 0 && summary.delivered === summary.total) {
      return;
    }

    await sleep(200);
  }

  const summary = await fetchOutboxSummary(client, runId);
  throw new Error(
    `Timed out waiting for delivery: delivered ${summary.delivered}/${summary.total}`
  );
}

async function fetchAuditCount(client: Client, runId: string): Promise<number> {
  const result = await client.query<AuditSummaryRow>(
    `
    select count(*)::text as total
    from audit_log
    where payload->>'runId' = $1
    `,
    [runId]
  );

  return Number(result.rows[0]?.total ?? '0');
}

async function runSmoke(): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const db = getDb();
  const auditRepository = new PgAuditRepository(db);
  const auditSubscriber = createAuditSubscriber(auditRepository, 'smoke:worker');

  const subscribers = [auditSubscriber];
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    subscribers.unshift(telegramSubscriber);
  }

  const worker = new OutboxWorker(db, subscribers, {
    pollIntervalMs: 200,
    maxAttempts: 5,
  });

  try {
    await prepareDb(client);

    const idempotencyKey = randomUUID();
    const runRequest = new NextRequest('http://localhost/api/v1/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({ campaign: smokeFixture }),
    });

    const runResponse = await postRun(runRequest);
    const runBody = (await runResponse.json()) as {
      runId?: string;
      error?: string;
      message?: string;
    };

    assert(runResponse.ok, `POST /api/v1/runs failed: ${runBody.error ?? runResponse.statusText}`);
    assert(typeof runBody.runId === 'string' && runBody.runId.length > 0, 'runId is missing');

    const startPromise = worker.start();
    await waitForDelivery(client, runBody.runId, 10_000);
    await worker.stop();
    await startPromise;

    const outboxSummary = await fetchOutboxSummary(client, runBody.runId);
    assert(
      outboxSummary.total > 0,
      'No outbox events found for run in smoke:worker'
    );
    assert(
      outboxSummary.delivered === outboxSummary.total,
      `Expected all outbox events delivered, got ${outboxSummary.delivered}/${outboxSummary.total}`
    );

    const auditCount = await fetchAuditCount(client, runBody.runId);
    assert(
      auditCount >= outboxSummary.total,
      `Expected audit_log to contain delivered events, got ${auditCount} audit rows for ${outboxSummary.total} outbox events`
    );

    console.log(
      `smoke:worker passed (outbox delivered=${outboxSummary.delivered}/${outboxSummary.total}, audit rows=${auditCount})`
    );

    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('Manual check: verify Telegram channel received RunCompleted notification.');
    }
  } finally {
    await worker.stop();
    await client.end();
  }
}

void runSmoke();
