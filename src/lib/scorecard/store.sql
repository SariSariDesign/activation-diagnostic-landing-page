-- Activation Scorecard persistence (Supabase).
-- Backs src/lib/scorecard/store.supabase.ts: analysis cache by URL, per-email
-- dedupe, and report retrieval by unguessable slug for the hosted /s/<slug> page.
--
-- COORDINATION: a parallel effort is standing up this same DB for caching. If a
-- scorecard table already exists there, add the `slug` column + unique index
-- instead of creating a second table, and reconcile column names.

create table if not exists public.scorecard_reports (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  url               text not null,
  domain            text not null,
  email             text not null,
  name              text not null,
  company           text not null,
  stage             text not null,
  overall_score     integer not null,
  result            jsonb not null,
  previous_score    integer,
  delta             integer,
  served_from_cache boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Cache/cooldown lookups hit (url, created_at); dedupe hits (url, email).
create index if not exists scorecard_reports_url_created_idx
  on public.scorecard_reports (url, created_at desc);
create index if not exists scorecard_reports_url_email_idx
  on public.scorecard_reports (url, email);

-- Server code uses the service-role key (bypasses RLS). Enable RLS with no public
-- policies so the anon key cannot read leads/reports directly.
alter table public.scorecard_reports enable row level security;
