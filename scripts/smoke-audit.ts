import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { Client } from 'pg';
import { POST as postRun } from '../app/api/v1/runs/route';
import { GET as getAudit } from '../app/api/v1/audit/route';
import { getDb } from '../infrastructure/db/client';
import { PgAuditRepository } from '../infrastructure/persistence/PgAuditRepository';
import { PreflightEventSchema } from '../domain/event/PreflightEvent';
import type { CampaignBundleInput } from '../schemas';
import { applyDbMigrations } from './db-smoke-helpers';

type OutboxRow = {
  payload: unknown;
};

type AuditRouteResponse = {
  items: Array<{
    id: string;
    eventType: string;
    payload: unknown;
    actor: string | null;
    createdAt: string;
  }>;
  nextCursor: string | null;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for smoke:audit');
}

const smokeFixture: CampaignBundleInput = {
  metadata: {
    campaignName: 'Smoke audit campaign',
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

async function runSmoke(): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await prepareDb(client);

    const idempotencyKey = randomUUID();
    const runRequest = new NextRequest('http://localhost/api/v1/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        campaign: smokeFixture,
      }),
    });

    const runResponse = await postRun(runRequest);
    const runBody = (await runResponse.json()) as {
      runId?: string;
      error?: string;
      message?: string;
    };

    assert(runResponse.ok, `POST /api/v1/runs failed: ${runBody.error ?? runResponse.statusText}`);
    assert(typeof runBody.runId === 'string', 'runId is missing in POST /api/v1/runs response');

    const outboxRows = await client.query<OutboxRow>(
      `
      select payload
      from outbox
      where payload->>'runId' = $1
      order by created_at asc, id asc
      `,
      [runBody.runId]
    );

    assert(outboxRows.rows.length > 0, 'No outbox rows found for created run');

    const auditRepository = new PgAuditRepository(getDb());

    for (const row of outboxRows.rows) {
      const event = PreflightEventSchema.parse(row.payload);
      await auditRepository.append(event, 'smoke:audit');
    }

    const listed = await auditRepository.list({ limit: 200 });
    assert(listed.items.length >= outboxRows.rows.length, 'Repository list returned fewer audit rows than appended');

    const auditRequest = new NextRequest('http://localhost/api/v1/audit?limit=200', {
      method: 'GET',
    });
    const auditResponse = await getAudit(auditRequest);
    const auditBody = (await auditResponse.json()) as AuditRouteResponse;

    assert(auditResponse.ok, `GET /api/v1/audit failed with status ${auditResponse.status}`);
    assert(Array.isArray(auditBody.items), 'GET /api/v1/audit returned invalid items');
    assert(
      auditBody.items.length >= outboxRows.rows.length,
      'GET /api/v1/audit did not expose appended audit events'
    );

    console.log(
      `smoke:audit passed (outbox events=${outboxRows.rows.length}, audit listed=${auditBody.items.length}, nextCursor=${auditBody.nextCursor ?? 'null'})`
    );
  } finally {
    await client.end();
  }
}

void runSmoke();
