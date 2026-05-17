import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@infra/db/client';

export const runtime = 'nodejs';

export const REQUIRED_READY_TABLES = ['runs', 'outbox', 'audit_log'] as const;

type ReadyTableName = (typeof REQUIRED_READY_TABLES)[number];
type ReadyReason =
  | 'missing_database_url'
  | 'database_unreachable'
  | 'required_tables_missing'
  | 'readiness_check_failed';
type ReadyCheckStatus = 'ok' | 'error';

type NotReadyPayload = {
  status: 'not-ready';
  reason: ReadyReason;
  checks: {
    env: ReadyCheckStatus;
    db: ReadyCheckStatus;
    migrations: ReadyCheckStatus;
  };
  missingTables?: ReadyTableName[];
};

type ReadyPayload = {
  status: 'ok';
  checks: {
    env: 'ok';
    db: 'ok';
    migrations: 'ok';
  };
};

export type NotReadyResponse = {
  status: 503;
  payload: NotReadyPayload;
};

const READY_RESPONSE: ReadyPayload = {
  status: 'ok',
  checks: {
    env: 'ok',
    db: 'ok',
    migrations: 'ok',
  },
};

const NOT_READY_CHECKS: Record<
  ReadyReason,
  NotReadyPayload['checks']
> = {
  missing_database_url: {
    env: 'error',
    db: 'error',
    migrations: 'error',
  },
  database_unreachable: {
    env: 'ok',
    db: 'error',
    migrations: 'error',
  },
  required_tables_missing: {
    env: 'ok',
    db: 'ok',
    migrations: 'error',
  },
  readiness_check_failed: {
    env: 'ok',
    db: 'error',
    migrations: 'error',
  },
};

type MissingTableRow = { table_name: string | null };

export function findMissingRequiredTables(rows: MissingTableRow[]): ReadyTableName[] {
  const existingTableNames = new Set<string>(
    rows
      .map((row) => row.table_name)
      .filter((tableName): tableName is string => typeof tableName === 'string')
  );

  return REQUIRED_READY_TABLES.filter((tableName) => !existingTableNames.has(tableName));
}

export function buildNotReadyResponse(
  reason: ReadyReason,
  missingTables?: ReadyTableName[]
): NotReadyResponse {
  return {
    status: 503,
    payload: {
      status: 'not-ready',
      reason,
      checks: NOT_READY_CHECKS[reason],
      ...(missingTables && missingTables.length > 0
        ? { missingTables }
        : {}),
    },
  };
}

function toResponse(payload: NotReadyResponse | ReadyPayload): Response {
  if ('status' in payload && payload.status === 503) {
    return NextResponse.json(payload.payload, { status: payload.status });
  }

  return NextResponse.json(payload);
}

export async function GET(): Promise<Response> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    return toResponse(buildNotReadyResponse('missing_database_url'));
  }

  const db = getDb();

  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    return toResponse(buildNotReadyResponse('database_unreachable'));
  }

  try {
    // Returns the required tables that DO exist; findMissingRequiredTables
    // then derives which required tables are absent. The predicate must be
    // IS NOT NULL — the helper expects the set of existing tables, not the
    // missing ones (otherwise readiness is inverted: a correctly migrated
    // DB reports 503 and an unmigrated DB falsely reports 200).
    const existingTableRows = await db.execute<MissingTableRow>(sql`
      SELECT required.table_name
      FROM (
        VALUES ('runs'), ('outbox'), ('audit_log')
      ) AS required(table_name)
      LEFT JOIN pg_catalog.pg_tables existing
        ON existing.schemaname = 'public'
       AND existing.tablename = required.table_name
      WHERE existing.tablename IS NOT NULL
    `);

    const missingTables = findMissingRequiredTables(
      existingTableRows.rows ?? []
    );
    if (missingTables.length > 0) {
      return toResponse(
        buildNotReadyResponse('required_tables_missing', missingTables)
      );
    }
  } catch {
    return toResponse(buildNotReadyResponse('readiness_check_failed'));
  }

  return toResponse(READY_RESPONSE);
}
