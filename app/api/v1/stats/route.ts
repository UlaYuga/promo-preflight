import { sql } from 'drizzle-orm';
import { StatsResponseSchema } from '../../../../api/v1/index';
import { getDb } from '../../../../infrastructure/db/client';

export const runtime = 'nodejs';

interface StatsRow extends Record<string, unknown> {
  total_runs: string | number;
  total_events: string | number;
  last_event_at: Date | string | null;
  run_p95_latency_ms: string | number | null;
}

function toIso(v: Date | string | null): string | null {
  if (v === null) return null;
  if (v instanceof Date) return v.toISOString();
  return new Date(v).toISOString();
}

function toIntOrNull(v: string | number | null): number | null {
  if (v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function GET(): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      StatsResponseSchema.parse({
        totalRuns: 0,
        totalEvents: 0,
        lastEventAt: null,
        runP95LatencyMs: null,
      })
    );
  }

  const db = getDb();

  // One round-trip, four aggregates. count(*) and max() are O(n) on small
  // tables; percentile_cont on (completed_at - created_at) returns an interval
  // that we collapse to milliseconds via extract(epoch from …) * 1000.
  const result = await db.execute<StatsRow>(sql`
    select
      (select count(*) from runs) as total_runs,
      (select count(*) from audit_log) as total_events,
      (select max(created_at) from audit_log) as last_event_at,
      (
        select
          extract(epoch from
            percentile_cont(0.95) within group (order by (completed_at - created_at))
          ) * 1000
        from runs
        where completed_at is not null
      ) as run_p95_latency_ms
  `);

  const row = result.rows[0];

  const response = {
    totalRuns: Number(row?.total_runs ?? 0),
    totalEvents: Number(row?.total_events ?? 0),
    lastEventAt: toIso(row?.last_event_at ?? null),
    runP95LatencyMs: toIntOrNull(row?.run_p95_latency_ms ?? null),
  };

  return Response.json(StatsResponseSchema.parse(response));
}
