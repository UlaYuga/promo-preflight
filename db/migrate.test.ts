import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL?.trim();

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
    }
  );
});
