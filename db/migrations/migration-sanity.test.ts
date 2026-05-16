import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

const sql = readFileSync(
  join(process.cwd(), 'db/migrations/0001_block4_complete_schema.sql'),
  'utf-8'
);

describe('db/migrations/0001_block4_complete_schema.sql', () => {
  const requiredTables = [
    'campaigns',
    'campaign_versions',
    'runs',
    'run_blockers',
    'idempotency_keys',
    'outbox',
    'audit_log',
  ];

  for (const table of requiredTables) {
    it(`creates table ${table}`, () => {
      expect(sql).toContain(`create table if not exists ${table}`);
    });
  }

  it('enables pgcrypto extension', () => {
    expect(sql).toContain('pgcrypto');
  });

  it('defines campaign_versions unique constraint (campaign_id, n)', () => {
    expect(sql).toContain('unique (campaign_id, n)');
  });

  it('indexes runs by campaign_id', () => {
    expect(sql).toContain('idx_runs_campaign_id');
  });

  it('indexes run_blockers by run_id', () => {
    expect(sql).toContain('idx_run_blockers_run_id');
  });

  it('indexes campaign_versions by campaign_id', () => {
    expect(sql).toContain('idx_campaign_versions_campaign_id');
  });

  it('indexes outbox by created_at and delivered_at', () => {
    expect(sql).toContain('idx_outbox_created_at');
    expect(sql).toContain('idx_outbox_delivered_at');
  });

  it('indexes audit_log by created_at and event_type+created_at', () => {
    expect(sql).toContain('idx_audit_log_created_at');
    expect(sql).toContain('idx_audit_log_event_type_created_at');
  });

  it('idempotency_keys has status column', () => {
    expect(sql).toContain('status');
    expect(sql).toContain("default 'pending'");
  });

  it('run_blockers references runs with cascade delete', () => {
    expect(sql).toMatch(/run_id\s+uuid\s+not null\s+references runs\(id\)\s+on delete cascade/);
  });

  it('does not use external-file directives (\\i, @import)', () => {
    expect(sql).not.toContain('\\i ');
    expect(sql).not.toContain('@import');
  });
});
