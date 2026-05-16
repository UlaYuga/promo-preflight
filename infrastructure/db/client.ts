import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): Db {
  return drizzle(getPool(), { schema });
}
