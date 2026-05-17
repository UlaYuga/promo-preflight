// Runs once when the server process starts (Next.js instrumentation hook).
// Applies db/migrations/*.sql so the production schema is never behind the
// deployed code. This runs inside the Next server bundle — the same context
// the API routes use — so the bundled `pg`/`drizzle-orm` resolve correctly
// (a standalone migrate script cannot: Next trims those from node_modules).
// The generated SQL uses `create table if not exists`, so re-running on every
// boot is safe and idempotent. A failure is logged but does not crash the
// server — /api/ready then truthfully reports the missing tables.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.warn("[migrate] DATABASE_URL not set — skipping migrations.");
    return;
  }

  try {
    const { readdir, readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { getDb } = await import("@infra/db/client");
    const { sql } = await import("drizzle-orm");

    const db = getDb();
    const dir = "db/migrations";
    const files = (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const text = await readFile(join(dir, file), "utf8");
      if (text.trim().length === 0) continue;
      await db.execute(sql.raw(text));
      console.log(`[migrate] applied ${file}`);
    }

    console.log("[migrate] schema up to date.");
  } catch (err) {
    console.error(
      "[migrate] migration failed; server will still start and /api/ready will report status:",
      err
    );
  }
}
