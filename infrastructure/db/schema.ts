import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// campaigns
// ---------------------------------------------------------------------------
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignName: text('campaign_name').notNull(),
    operatorLabel: text('operator_label'),
    promoType: text('promo_type').notNull(),
    geo: text('geo').notNull(),
    locale: text('locale').notNull(),
    currency: text('currency').notNull(),
    launchDate: date('launch_date'),
    sanitizedSummary: jsonb('sanitized_summary'),
    rawInputExpiresAt: timestamp('raw_input_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_campaigns_created_at').on(t.createdAt)]
);

// ---------------------------------------------------------------------------
// campaign_versions — tracks successive runs of the same campaign
// ---------------------------------------------------------------------------
export const campaignVersions = pgTable(
  'campaign_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    n: integer('n').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    extractedFactsJson: jsonb('extracted_facts_json').notNull(),
    blockersJson: jsonb('blockers_json').notNull().default([]),
    readinessState: text('readiness_state').notNull(),
  },
  (t) => [
    unique('campaign_versions_campaign_n_unique').on(t.campaignId, t.n),
    index('idx_campaign_versions_campaign_id').on(t.campaignId),
  ]
);

// ---------------------------------------------------------------------------
// runs — domain Run entity (one per POST /api/v1/runs)
// ---------------------------------------------------------------------------
export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey(),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    campaignVersion: integer('campaign_version'),
    verdict: text('verdict').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('idx_runs_campaign_id').on(t.campaignId)]
);

// ---------------------------------------------------------------------------
// run_blockers — per-run blocker records (RunBlocker domain type)
// ---------------------------------------------------------------------------
export const runBlockers = pgTable(
  'run_blockers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    ruleId: text('rule_id').notNull(),
    severity: text('severity').notNull(),
    evidence: text('evidence').notNull(),
    suggestion: text('suggestion').notNull(),
    ownerHint: text('owner_hint'),
  },
  (t) => [index('idx_run_blockers_run_id').on(t.runId)]
);

// ---------------------------------------------------------------------------
// idempotency_keys — T-019: idempotency for POST /api/v1/runs
// ---------------------------------------------------------------------------
export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  requestHash: text('request_hash').notNull(),
  responseSnapshot: jsonb('response_snapshot').notNull().default({}),
  // 'pending' while the owning transaction is in-flight; 'completed' once committed.
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// campaign_assets, campaign_links, campaign_owners — existing tables kept
// for DB consistency; not used by repositories directly
// ---------------------------------------------------------------------------
export const campaignAssets = pgTable('campaign_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  fieldName: text('field_name').notNull(),
  textExcerpt: text('text_excerpt'),
  charCount: integer('char_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campaignLinks = pgTable('campaign_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  url: text('url').notNull(),
  expectedDomain: text('expected_domain'),
  requiresUtm: boolean('requires_utm').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campaignOwners = pgTable('campaign_owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  name: text('name'),
  status: text('status').notNull().default('pending'),
  dueDate: date('due_date'),
  notes: text('notes'),
});
