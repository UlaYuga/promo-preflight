import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { Client } from 'pg';
import { POST } from '../app/api/v1/runs/route';
import type { CampaignBundleInput } from '../schemas';

type OutboxRow = {
  event_type: string;
  delivered_at: Date | null;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for smoke:outbox');
}

const smokeFixture: CampaignBundleInput = {
  metadata: {
    campaignName: 'Smoke outbox campaign',
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
  const sql = await readFile(
    join(process.cwd(), 'db/migrations/0001_block4_complete_schema.sql'),
    'utf8'
  );
  await client.query(sql);
  await client.query(`
    truncate table
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

    const idempotencyKey = `smoke-outbox-${Date.now()}`;
    const req = new NextRequest('http://localhost/api/v1/runs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        campaign: smokeFixture,
      }),
    });

    const response = await POST(req);
    const body = (await response.json()) as {
      runId?: string;
      blockers?: Array<unknown>;
      error?: string;
      message?: string;
    };

    assert(response.ok, `POST /api/v1/runs failed: ${body.error ?? response.statusText}`);
    assert(typeof body.runId === 'string' && body.runId.length > 0, 'Response missing runId');

    const runId = body.runId;
    const expectedBlockerCount = body.blockers?.length ?? 0;

    const outboxRows = await client.query<OutboxRow>(
      `
      select event_type, delivered_at
      from outbox
      where payload->>'runId' = $1
      order by created_at asc
      `,
      [runId]
    );

    const startedCount = outboxRows.rows.filter((r) => r.event_type === 'RunStarted').length;
    const blockerRaisedCount = outboxRows.rows.filter(
      (r) => r.event_type === 'BlockerRaised'
    ).length;
    const completedCount = outboxRows.rows.filter((r) => r.event_type === 'RunCompleted').length;
    const hasDeliveredRows = outboxRows.rows.some((r) => r.delivered_at !== null);

    assert(startedCount === 1, `Expected 1 RunStarted, got ${startedCount}`);
    assert(
      blockerRaisedCount === expectedBlockerCount,
      `Expected ${expectedBlockerCount} BlockerRaised, got ${blockerRaisedCount}`
    );
    assert(completedCount === 1, `Expected 1 RunCompleted, got ${completedCount}`);
    assert(!hasDeliveredRows, 'Expected delivered_at to be NULL for all outbox rows');

    console.log(
      `smoke:outbox passed (RunStarted=1, BlockerRaised=${blockerRaisedCount}, RunCompleted=1)`
    );
  } finally {
    await client.end();
  }
}

void runSmoke();
