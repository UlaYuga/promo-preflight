import { describe, expect, it } from 'vitest';
import {
  buildNotReadyResponse,
  findMissingRequiredRunColumns,
  findMissingRequiredTables,
  REQUIRED_RUN_COLUMNS,
  REQUIRED_READY_TABLES,
} from './route';

describe('ready route helpers', () => {
  it('returns all required tables when no tables exist', () => {
    expect(findMissingRequiredTables([])).toEqual([...REQUIRED_READY_TABLES]);
  });

  it('returns only missing subset when some tables exist', () => {
    expect(findMissingRequiredTables([{ table_name: 'runs' }, { table_name: 'outbox' }])).toEqual([
      'audit_log',
    ]);
  });

  it('builds stable 503 payload without secret values', () => {
    expect(buildNotReadyResponse('database_unreachable')).toEqual({
      status: 503,
      payload: {
        status: 'not-ready',
        reason: 'database_unreachable',
        checks: {
          env: 'ok',
          db: 'error',
          migrations: 'error',
        },
      },
    });
  });

  it('requires the policy provenance run column for readiness', () => {
    expect(findMissingRequiredRunColumns([])).toEqual([...REQUIRED_RUN_COLUMNS]);
    expect(findMissingRequiredRunColumns([{ column_name: 'policy_rule_versions_json' }])).toEqual([]);
  });
});
