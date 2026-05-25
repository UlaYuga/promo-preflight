import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
const migrationsFolder = process.env.DRIZZLE_MIGRATIONS_FOLDER?.trim()
  ? resolve(process.env.DRIZZLE_MIGRATIONS_FOLDER.trim())
  : join(dirname(fileURLToPath(import.meta.url)), "migrations");
const migrationsSchema =
  process.env.DRIZZLE_MIGRATIONS_SCHEMA?.trim() || undefined;

if (!databaseUrl) {
  console.error("[migrate] migration failed: DATABASE_URL is not set.");
  process.exitCode = 1;
} else {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    const db = drizzle(pool);
    await migrate(db, {
      migrationsFolder,
      ...(migrationsSchema ? { migrationsSchema } : {}),
    });
    console.log("[migrate] schema up to date.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[migrate] migration failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}
