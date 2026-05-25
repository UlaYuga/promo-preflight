import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("[migrate] migration failed: DATABASE_URL is not set.");
  process.exitCode = 1;
} else {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  const migrationsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "migrations"
  );

  try {
    await client.connect();

    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const migrationSql = await readFile(join(migrationsDir, file), "utf8");
      if (migrationSql.trim().length === 0) {
        continue;
      }

      await client.query(migrationSql);
      console.log(`[migrate] applied ${file}`);
    }

    console.log("[migrate] schema up to date.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[migrate] migration failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
