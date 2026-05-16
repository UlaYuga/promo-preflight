-- T-014: Add runs, run_blockers, idempotency_keys tables
-- Apply after db/schema.sql

create table if not exists runs (
  id uuid primary key,
  campaign_id uuid references campaigns(id) on delete set null,
  campaign_version integer,
  verdict text not null,
  status text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_runs_campaign_id on runs(campaign_id);

create table if not exists run_blockers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  rule_id text not null,
  severity text not null,
  evidence text not null,
  suggestion text not null,
  owner_hint text
);

create index if not exists idx_run_blockers_run_id on run_blockers(run_id);

create table if not exists idempotency_keys (
  key text primary key,
  request_hash text not null,
  response_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
