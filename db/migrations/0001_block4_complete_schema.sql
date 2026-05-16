-- Block 4 complete schema — applies to a fresh database in a single pass.
-- Creates all tables required by the Block 4 API (T-014 through T-019).
-- No dependency on db/schema.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists campaigns (
  id            uuid        primary key default gen_random_uuid(),
  campaign_name text        not null,
  operator_label text,
  promo_type    text        not null,
  geo           text        not null,
  locale        text        not null,
  currency      text        not null,
  launch_date   date,
  sanitized_summary        jsonb,
  raw_input_expires_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_campaigns_created_at
  on campaigns(created_at);

-- ---------------------------------------------------------------------------
-- campaign_versions — one row per run of the same campaign
-- ---------------------------------------------------------------------------
create table if not exists campaign_versions (
  id                   uuid        primary key default gen_random_uuid(),
  campaign_id          uuid        not null references campaigns(id) on delete cascade,
  n                    integer     not null,
  created_at           timestamptz not null default now(),
  extracted_facts_json jsonb       not null default '{}'::jsonb,
  blockers_json        jsonb       not null default '[]'::jsonb,
  readiness_state      text        not null,
  constraint campaign_versions_campaign_n_unique unique (campaign_id, n)
);

create index if not exists idx_campaign_versions_campaign_id
  on campaign_versions(campaign_id);

comment on column campaign_versions.extracted_facts_json is
  'Structured check-result facts only — no raw copy, no raw T&C input.';
comment on column campaign_versions.blockers_json is
  'Structured blocker records derived from check results. No raw input.';

-- ---------------------------------------------------------------------------
-- runs — domain Run entity (one per POST /api/v1/runs call)
-- ---------------------------------------------------------------------------
create table if not exists runs (
  id               uuid        primary key,
  campaign_id      uuid        references campaigns(id) on delete set null,
  campaign_version integer,
  verdict          text        not null,
  status           text        not null,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists idx_runs_campaign_id
  on runs(campaign_id);

-- ---------------------------------------------------------------------------
-- run_blockers — per-run blocker records (RunBlocker domain type)
-- ---------------------------------------------------------------------------
create table if not exists run_blockers (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs(id) on delete cascade,
  rule_id     text not null,
  severity    text not null,
  evidence    text not null,
  suggestion  text not null,
  owner_hint  text
);

create index if not exists idx_run_blockers_run_id
  on run_blockers(run_id);

-- ---------------------------------------------------------------------------
-- idempotency_keys — T-019: dedup / replay for POST /api/v1/runs
--
-- Lifecycle:
--   1. INSERT with status='pending' (placeholder) at start of transaction.
--   2. UPDATE to status='completed' with real response_snapshot at end.
-- The PRIMARY KEY guarantees only one transaction can claim a key.
-- ---------------------------------------------------------------------------
create table if not exists idempotency_keys (
  key               text        primary key,
  request_hash      text        not null,
  response_snapshot jsonb       not null default '{}'::jsonb,
  status            text        not null default 'pending',
  created_at        timestamptz not null default now(),
  expires_at        timestamptz
);

-- ---------------------------------------------------------------------------
-- outbox — transactional outbox rows written in the same tx as domain writes
-- ---------------------------------------------------------------------------
create table if not exists outbox (
  id           uuid        primary key default gen_random_uuid(),
  event_type   text        not null,
  payload      jsonb       not null,
  created_at   timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists idx_outbox_created_at
  on outbox(created_at);

create index if not exists idx_outbox_delivered_at
  on outbox(delivered_at);

-- ---------------------------------------------------------------------------
-- audit_log — append-only log for delivered domain events
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id         uuid        primary key default gen_random_uuid(),
  event_type text        not null,
  payload    jsonb       not null,
  actor      text        default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at
  on audit_log(created_at);

create index if not exists idx_audit_log_event_type_created_at
  on audit_log(event_type, created_at);
