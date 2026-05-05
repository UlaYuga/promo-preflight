# Database

Database migrations, seed data, and schema notes live here.

## Files

- `schema.sql` creates the Postgres schema from spec section 16.
- `seed.sql` upserts the eight check definitions and eight synthetic worked examples from spec section 18.
- `check.mjs` applies `schema.sql` and `seed.sql` against `DATABASE_URL`, then verifies the expected row counts.

## Raw input safety

The durable schema stores sanitized summaries, short asset excerpts, sanitized export payloads, and synthetic worked examples. It does not include a durable raw campaign input or full raw T&C column by default.

## Validation

Run:

```bash
npm run db:check
```

`DATABASE_URL` must point to a reachable Postgres database. If it is missing or Postgres is unavailable, the command exits with a clear error instead of reporting success.
