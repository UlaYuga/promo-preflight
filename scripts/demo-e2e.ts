import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import { Client } from 'pg';
import { RunResponseSchema } from '../api/v1';
import { Bus } from '../application/bus/Bus';
import { HandlerRegistry } from '../application/bus/HandlerRegistry';
import type { RunChecksCommand } from '../application/command/RunChecksCommand';
import type { Run } from '../domain/model/Run';
import { createAuditSubscriber } from '../infrastructure/audit';
import { getDb } from '../infrastructure/db/client';
import { handler as runChecksHandler } from '../infrastructure/handler/checks/RunChecksHandler';
import { OutboxWorker } from '../infrastructure/outbox';
import { PgAuditRepository } from '../infrastructure/persistence/PgAuditRepository';
import { telegramSubscriber } from '../infrastructure/telegram';
import type { CampaignBundleInput } from '../schemas';
import { workedExamples } from '../schemas/worked-examples';

interface OutboxSummaryRow {
  total: string;
  delivered: string;
}

interface AuditSummaryRow {
  total: string;
}

interface ExampleSelection {
  id: string;
  publicLabel: string;
  bundle: CampaignBundleInput;
  blockCount: number;
}

interface DeliverySummary {
  auditCount: number;
  outboxTotal: number;
  deliveredCount: number;
}

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for demo:e2e');
}

const apiKey = process.env.PREFLIGHT_API_KEY;
if (!apiKey) {
  throw new Error('PREFLIGHT_API_KEY is required for demo:e2e');
}

const baseUrl = normalizeBaseUrl(
  process.env.PRELIGHT_BASE_URL ??
    process.env.PREFLIGHT_BASE_URL ??
    'http://localhost:3000'
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyApiReachable(url: string): Promise<void> {
  const endpoint = `${url}/api/v1/audit?limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 400);
    throw new Error(`API is not reachable at ${endpoint}: ${response.status} ${body}`);
  }
}

async function selectMostBlockingExample(): Promise<ExampleSelection> {
  const registry = new HandlerRegistry();
  registry.register(runChecksHandler);
  const bus = new Bus(registry);

  const ids = Object.keys(workedExamples)
    .filter((id) => /^EX\d+$/.test(id))
    .sort();

  let selected: ExampleSelection | null = null;

  for (const id of ids) {
    const example = workedExamples[id];
    const command: RunChecksCommand = {
      type: 'RunChecks',
      campaign: example.bundle as RunChecksCommand['campaign'],
    };

    const result = await bus.dispatch<Run>(command);
    if (!result.ok || result.value.verdict !== 'BLOCK') {
      continue;
    }

    const blockCount = result.value.blockers.filter((item) => item.severity === 'block').length;
    if (
      selected === null ||
      blockCount > selected.blockCount ||
      (blockCount === selected.blockCount && id < selected.id)
    ) {
      selected = {
        id,
        publicLabel: example.publicLabel,
        bundle: example.bundle,
        blockCount,
      };
    }
  }

  if (!selected) {
    throw new Error('No BLOCK worked example was found');
  }

  return selected;
}

async function postRun(url: string, bundle: CampaignBundleInput): Promise<{
  runId: string;
  verdict: 'GO' | 'WARN' | 'BLOCK';
  blockerCount: number;
}> {
  const response = await fetch(`${url}/api/v1/runs`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'idempotency-key': randomUUID(),
    },
    body: JSON.stringify({ campaign: bundle }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`POST /api/v1/runs failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  const parsed = RunResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Unexpected /api/v1/runs response: ${parsed.error.message}`);
  }

  return {
    runId: parsed.data.runId,
    verdict: parsed.data.verdict,
    blockerCount: parsed.data.counts.block,
  };
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

  return {
    total: Number(result.rows[0]?.total ?? '0'),
    delivered: Number(result.rows[0]?.delivered ?? '0'),
  };
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

async function waitForAuditDelivery(client: Client, runId: string, timeoutMs: number): Promise<DeliverySummary> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const outbox = await fetchOutboxSummary(client, runId);
    const auditCount = await fetchAuditCount(client, runId);

    if (
      outbox.total > 0 &&
      outbox.delivered === outbox.total &&
      auditCount >= outbox.total
    ) {
      return {
        auditCount,
        outboxTotal: outbox.total,
        deliveredCount: outbox.delivered,
      };
    }

    await sleep(500);
  }

  const outbox = await fetchOutboxSummary(client, runId);
  const auditCount = await fetchAuditCount(client, runId);
  throw new Error(
    `Timed out waiting for outbox/audit delivery for run ${runId} (outbox ${outbox.delivered}/${outbox.total}, audit ${auditCount})`
  );
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

async function runDemo(): Promise<void> {
  await verifyApiReachable(baseUrl);

  const selected = await selectMostBlockingExample();
  assert(selected.blockCount > 0, 'Selected fixture must include at least one BLOCK blocker');

  const db = getDb();
  const auditRepository = new PgAuditRepository(db);
  const auditSubscriber = createAuditSubscriber(auditRepository, 'demo:e2e');
  // Audit before Telegram — see instrumentation.ts / preflight-worker.ts.
  const worker = new OutboxWorker(db, [auditSubscriber, telegramSubscriber], {
    pollIntervalMs: 200,
    maxAttempts: 5,
  });

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  let runId = '';
  const startPromise = worker.start();

  try {
    const run = await postRun(baseUrl, selected.bundle);
    runId = run.runId;

    const delivery = await waitForAuditDelivery(client, run.runId, 10_000);
    assert(delivery.outboxTotal > 0, 'Outbox did not receive any events for the run');

    console.log(`fixture: ${selected.id} (${selected.publicLabel})`);
    console.log(`runId: ${run.runId}`);
    console.log(`verdict: ${run.verdict}`);
    console.log(`blockerCount: ${run.blockerCount}`);
    console.log(`auditEventCount: ${delivery.auditCount}`);
    console.log('Check your Telegram channel — the message should be there now.');
  } finally {
    await worker.stop();
    await startPromise;
    await client.end();
    if (!runId) {
      process.exitCode = 1;
    }
  }
}

void runDemo();
