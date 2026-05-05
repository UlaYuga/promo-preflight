import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const expectedCheckIds = [
  "channel_consistency",
  "terms_robustness",
  "offer_math_sanity",
  "jurisdictional_risk_signals",
  "localization_qa",
  "launch_ownership",
  "link_qa",
  "format_qa"
];

const expectedExampleIds = [
  "EX01",
  "EX02",
  "EX03",
  "EX04",
  "EX05",
  "EX06",
  "EX07",
  "EX08"
];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DB check skipped: DATABASE_URL is not set.");
  console.error(
    "Set DATABASE_URL to a reachable Postgres database and rerun npm run db:check."
  );
  process.exit(1);
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDir, "schema.sql");
const seedPath = join(currentDir, "seed.sql");

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000
});

const countRows = async (tableName, columnName, expectedIds) => {
  const result = await client.query(
    `select ${columnName} from ${tableName} where ${columnName} = any($1::text[]) order by ${columnName}`,
    [expectedIds]
  );

  return result.rows.map((row) => row[columnName]);
};

try {
  const [schemaSql, seedSql] = await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(seedPath, "utf8")
  ]);

  await client.connect();
  await client.query(schemaSql);
  await client.query(seedSql);

  const checkIds = await countRows("check_definitions", "check_id", expectedCheckIds);
  const exampleIds = await countRows("worked_examples", "id", expectedExampleIds);

  const missingCheckIds = expectedCheckIds.filter((id) => !checkIds.includes(id));
  const missingExampleIds = expectedExampleIds.filter((id) => !exampleIds.includes(id));

  if (missingCheckIds.length > 0 || missingExampleIds.length > 0) {
    const messages = [];

    if (missingCheckIds.length > 0) {
      messages.push(`missing check definitions: ${missingCheckIds.join(", ")}`);
    }

    if (missingExampleIds.length > 0) {
      messages.push(`missing worked examples: ${missingExampleIds.join(", ")}`);
    }

    throw new Error(`DB check failed: ${messages.join("; ")}`);
  }

  console.log("DB check passed.");
  console.log(`Check definitions: ${checkIds.length}/8`);
  console.log(`Worked examples: ${exampleIds.length}/8`);
} catch (error) {
  console.error("DB check failed while applying schema/seeds or validating rows.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
