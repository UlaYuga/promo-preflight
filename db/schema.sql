create extension if not exists pgcrypto;

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  operator_label text,
  promo_type text not null,
  geo text not null,
  locale text not null,
  currency text not null,
  launch_date date,
  sanitized_summary jsonb,
  raw_input_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  channel text not null,
  field_name text not null,
  text_excerpt text,
  char_count int,
  created_at timestamptz not null default now()
);

create table if not exists campaign_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  label text not null,
  url text not null,
  expected_domain text,
  requires_utm boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists campaign_owners (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  role text not null,
  name text,
  status text not null default 'pending',
  due_date date,
  notes text
);

create table if not exists check_definitions (
  check_id text primary key,
  public_name text not null,
  description text not null,
  core_value boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists check_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete set null,
  mode text not null,
  model_core text,
  model_fast text,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists check_results (
  id uuid primary key default gen_random_uuid(),
  check_run_id uuid not null references check_runs(id) on delete cascade,
  check_id text not null references check_definitions(check_id),
  status text not null,
  severity text,
  summary text not null,
  confidence numeric(4,3),
  deterministic_signals jsonb,
  parsing_error text
);

create table if not exists check_issues (
  id uuid primary key default gen_random_uuid(),
  check_result_id uuid not null references check_results(id) on delete cascade,
  issue_id text not null,
  severity text not null,
  blocker boolean not null default false,
  detected_issue text not null,
  evidence jsonb not null default '[]'::jsonb,
  suggested_fix text not null,
  owner_suggestion text,
  confidence numeric(4,3)
);

create table if not exists launch_readiness (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  check_run_id uuid references check_runs(id) on delete set null,
  state text not null,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists readiness_owners (
  id uuid primary key default gen_random_uuid(),
  readiness_id uuid not null references launch_readiness(id) on delete cascade,
  role text not null,
  name text,
  status text not null,
  linked_issue_ids text[] not null default '{}',
  due_date date,
  notes text
);

create table if not exists readiness_blockers (
  id uuid primary key default gen_random_uuid(),
  readiness_id uuid not null references launch_readiness(id) on delete cascade,
  title text not null,
  source_check_id text not null,
  severity text not null,
  owner_role text,
  required_action text not null,
  status text not null default 'open',
  due_date date
);

create table if not exists readiness_dependencies (
  id uuid primary key default gen_random_uuid(),
  readiness_id uuid not null references launch_readiness(id) on delete cascade,
  dependency text not null,
  depends_on text,
  owner_role text,
  status text not null default 'open',
  notes text
);

create table if not exists worked_examples (
  id text primary key,
  public_label text not null,
  pattern_note text not null,
  promo_type text not null,
  geo text not null,
  locale text not null,
  bundle jsonb not null,
  expected_results jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete set null,
  check_run_id uuid references check_runs(id) on delete set null,
  format text not null,
  include_source_excerpts boolean not null default false,
  sanitized_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_campaigns_created_at on campaigns(created_at);
create index if not exists idx_campaigns_raw_ttl on campaigns(raw_input_expires_at);
create index if not exists idx_check_runs_campaign_id on check_runs(campaign_id);
create index if not exists idx_check_results_run_check on check_results(check_run_id, check_id);
create index if not exists idx_check_issues_result on check_issues(check_result_id);
create index if not exists idx_readiness_campaign on launch_readiness(campaign_id);

comment on column campaigns.sanitized_summary is
  'Sanitized campaign summary only; raw campaign input is not stored by default.';
comment on column campaigns.raw_input_expires_at is
  'Optional TTL marker for temporary raw input handling outside the durable schema.';
comment on column campaign_assets.text_excerpt is
  'Short source excerpt only, not full raw T&C or full raw campaign copy.';
comment on column exports.sanitized_payload is
  'Export metadata and report payload after sanitization.';
comment on column worked_examples.bundle is
  'Synthetic or rewritten demo bundle only; no real operator material.';

-- T15: campaign versioning tables
create table if not exists campaign_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  n integer not null,
  created_at timestamptz not null default now(),
  extracted_facts_json jsonb not null,
  blockers_json jsonb not null default '[]'::jsonb,
  readiness_state text not null,
  constraint campaign_versions_campaign_n_unique unique (campaign_id, n)
);

create index if not exists idx_campaign_versions_campaign_id
  on campaign_versions(campaign_id);

comment on column campaign_versions.extracted_facts_json is
  'Structured check result facts only — no raw copy, no raw T&C input.';
comment on column campaign_versions.blockers_json is
  'Structured blocker records derived from check results. No raw input.';
