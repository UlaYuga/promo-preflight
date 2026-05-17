import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './infrastructure/db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/preflight',
  },
  verbose: true,
  strict: true,
});
