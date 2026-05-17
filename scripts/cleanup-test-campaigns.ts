/**
 * One-off maintenance: remove synthetic test campaigns from a database.
 *
 * Scope is a hardcoded allowlist of test-only name prefixes — it can never
 * touch real demo data (e.g. EX* worked examples keep their realistic names).
 * Deleting a `campaigns` row cascades to campaign_versions / assets / links /
 * owners (FK onDelete: cascade) and nulls runs.campaign_id (onDelete: set
 * null); the append-only outbox / audit_log are intentionally left intact.
 *
 * Dry-run by default. Pass --apply to actually delete. Idempotent: a second
 * run finds nothing and exits 0.
 *
 *   DATABASE_URL=postgres://... npx tsx scripts/cleanup-test-campaigns.ts
 *   DATABASE_URL=postgres://... npx tsx scripts/cleanup-test-campaigns.ts --apply
 */
import { Client } from 'pg';

const TEST_NAME_PATTERNS = ['QA-RACE-%', 'VERIFY-FIX-%'] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim() === '') {
    console.error('DATABASE_URL is required (point it at the target database).');
    process.exit(1);
  }

  const apply = process.argv.includes('--apply');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const where = TEST_NAME_PATTERNS.map((_, i) => `campaign_name LIKE $${i + 1}`).join(' OR ');
    const params = [...TEST_NAME_PATTERNS];

    const preview = await client.query<{ id: string; campaign_name: string; created_at: string }>(
      `SELECT id, campaign_name, created_at FROM campaigns WHERE ${where} ORDER BY campaign_name, created_at`,
      params
    );

    if (preview.rowCount === 0) {
      console.log('Nothing to clean — no test campaigns match', TEST_NAME_PATTERNS.join(', '));
      return;
    }

    console.log(`Matched ${preview.rowCount} test campaign row(s):`);
    for (const r of preview.rows) {
      console.log(`  ${r.id}  ${r.campaign_name}  ${new Date(r.created_at).toISOString()}`);
    }

    if (!apply) {
      console.log('\nDRY RUN — nothing deleted. Re-run with --apply to delete the rows above.');
      return;
    }

    const del = await client.query(
      `DELETE FROM campaigns WHERE ${where}`,
      params
    );
    console.log(`\nDeleted ${del.rowCount} campaign row(s). ` +
      `Versions/assets/links/owners cascaded; runs.campaign_id set null; ` +
      `outbox/audit_log left intact (append-only).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('cleanup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
