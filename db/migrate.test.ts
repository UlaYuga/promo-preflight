import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL?.trim();
const POSTGRES_INTEGRATION_TIMEOUT_MS = 30_000;

function databaseUrlForDatabase(baseUrl: string, databaseName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function runMigrate(env: Partial<NodeJS.ProcessEnv>): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [join('db', 'migrate.mjs')], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  });
}

describe('db migration runner', () => {
  it('exits non-zero when it cannot connect to Postgres', () => {
    const result = runMigrate({
      DATABASE_URL: 'postgres://preflight:preflight@127.0.0.1:1/preflight',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[migrate] migration failed:');
    expect(result.stderr).not.toContain('MODULE_NOT_FOUND');
  });

  it.skipIf(!databaseUrl)(
    'does not reapply an already recorded non-idempotent Drizzle migration',
    async () => {
      if (!databaseUrl) return;
      const marker = `predeploy_once_${process.pid}_${Date.now()}`;
      const migrationsSchema = `drizzle_${marker}`;
      const migrationsFolder = mkdtempSync(join(tmpdir(), 'preflight-migrations-'));
      const client = new Client({ connectionString: databaseUrl });

      mkdirSync(join(migrationsFolder, 'meta'));
      writeFileSync(
        join(migrationsFolder, 'meta', '_journal.json'),
        JSON.stringify({
          version: '7',
          dialect: 'postgresql',
          entries: [
            {
              idx: 0,
              version: '7',
              when: Date.now(),
              tag: '0000_non_idempotent',
              breakpoints: true,
            },
          ],
        })
      );
      writeFileSync(
        join(migrationsFolder, '0000_non_idempotent.sql'),
        `create table "${marker}" (id integer not null);`
      );

      try {
        const env = {
          DATABASE_URL: databaseUrl,
          DRIZZLE_MIGRATIONS_FOLDER: migrationsFolder,
          DRIZZLE_MIGRATIONS_SCHEMA: migrationsSchema,
        };
        const first = runMigrate(env);
        const second = runMigrate(env);

        expect(first.stderr).toBe('');
        expect(first.status).toBe(0);
        expect(second.stderr).toBe('');
        expect(second.status).toBe(0);

        await client.connect();
        const markerResult = await client.query<{ table_name: string }>(
          'select table_name from information_schema.tables where table_schema = $1 and table_name = $2',
          ['public', marker]
        );
        expect(markerResult.rows).toEqual([{ table_name: marker }]);
      } finally {
        await client
          .query(`drop table if exists "${marker}"`)
          .catch(() => undefined);
        await client
          .query(`drop schema if exists "${migrationsSchema}" cascade`)
          .catch(() => undefined);
        await client.end().catch(() => undefined);
        rmSync(migrationsFolder, { recursive: true, force: true });
      }
    },
    POSTGRES_INTEGRATION_TIMEOUT_MS
  );

  it.skipIf(!databaseUrl)(
    '0002 backfills legacy idempotency snapshots to the new policy provenance contract',
    async () => {
      if (!databaseUrl) return;
      const marker = `policy_snapshot_${process.pid}_${Date.now()}`;
      const databaseName = marker;
      const migrationsSchema = `drizzle_${marker}`;
      const migrationsFolder = mkdtempSync(join(tmpdir(), 'preflight-migrations-'));
      const adminClient = new Client({ connectionString: databaseUrl });
      let adminConnected = false;
      const isolatedDatabaseUrl = databaseUrlForDatabase(databaseUrl, databaseName);
      const client = new Client({ connectionString: isolatedDatabaseUrl });

      mkdirSync(join(migrationsFolder, 'meta'));
      writeFileSync(
        join(migrationsFolder, 'meta', '_journal.json'),
        JSON.stringify({
          version: '7',
          dialect: 'postgresql',
          entries: [
            {
              idx: 0,
              version: '7',
              when: Date.now(),
              tag: '0000_schema',
              breakpoints: true,
            },
            {
              idx: 1,
              version: '7',
              when: Date.now() + 1,
              tag: '0001_policy_rule_versions',
              breakpoints: true,
            },
          ],
        })
      );
      writeFileSync(
        join(migrationsFolder, '0000_schema.sql'),
        `create table runs (id uuid primary key);
create table idempotency_keys (
  key text primary key,
  request_hash text not null,
  response_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
);
insert into idempotency_keys (key, request_hash, response_snapshot, status)
values ('${marker}', 'hash', '{"runId":"run-1","verdict":"GO","status":"completed","counts":{"block":0,"warn":0,"info":0},"blockers":[],"createdAt":"2026-05-25T12:00:00.000Z"}'::jsonb, 'completed');`
      );
      const shippingPolicyRuleVersionsMigration = readFileSync(
        join(process.cwd(), 'db/migrations/0002_policy_rule_versions.sql'),
        'utf8'
      );

      writeFileSync(
        join(migrationsFolder, '0001_policy_rule_versions.sql'),
        shippingPolicyRuleVersionsMigration
      );

      try {
        await adminClient.connect();
        adminConnected = true;
        await adminClient.query(`create database "${databaseName}"`);

        const env = {
          DATABASE_URL: isolatedDatabaseUrl,
          DRIZZLE_MIGRATIONS_FOLDER: migrationsFolder,
          DRIZZLE_MIGRATIONS_SCHEMA: migrationsSchema,
        };

        const first = runMigrate(env);
        const second = runMigrate(env);

        expect(first.stderr).toBe('');
        expect(first.status).toBe(0);
        expect(second.stderr).toBe('');
        expect(second.status).toBe(0);

        await client.connect();
        const result = await client.query<{ response_snapshot: unknown }>(
          'select response_snapshot from idempotency_keys where key = $1',
          [marker]
        );

        expect(result.rows[0].response_snapshot).toMatchObject({
          policyRuleVersions: {
            paymentCompatibility: 1,
            cryptoDisclosure: 1,
            jurisdictionalRisk: 1,
          },
        });
      } finally {
        await client.query('drop table if exists idempotency_keys').catch(() => undefined);
        await client.query('drop table if exists runs').catch(() => undefined);
        await client
          .query(`drop schema if exists "${migrationsSchema}" cascade`)
          .catch(() => undefined);
        await client.end().catch(() => undefined);
        if (adminConnected) {
          await adminClient
            .query(`drop database if exists "${databaseName}" with (force)`)
            .catch(() => undefined);
        }
        await adminClient.end().catch(() => undefined);
        rmSync(migrationsFolder, { recursive: true, force: true });
      }
    },
    POSTGRES_INTEGRATION_TIMEOUT_MS
  );
});
