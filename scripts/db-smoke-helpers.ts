import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Client } from 'pg';

export async function applyDbMigrations(client: Client): Promise<void> {
  const migrationsDir = join(process.cwd(), 'db/migrations');
  const migrationFiles = (await readdir(migrationsDir))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();

  for (const file of migrationFiles) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await client.query(sql);
  }
}
