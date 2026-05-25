import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('db migration runner', () => {
  it('exits non-zero when it cannot connect to Postgres', () => {
    const result = spawnSync(process.execPath, [join('db', 'migrate.mjs')], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: 'postgres://preflight:preflight@127.0.0.1:1/preflight',
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('[migrate] migration failed:');
    expect(result.stderr).not.toContain('MODULE_NOT_FOUND');
  });
});
