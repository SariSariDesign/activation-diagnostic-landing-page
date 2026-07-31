# Activation Scorecard: persistence, re-score & validation suite

**Date:** 2026-07-31
**Status:** Approved design, pending implementation plan
**Branch:** `scorecard-storage-and-tests`

## Context

The free Activation Scorecard lead magnet is live at
`https://activation-diagnostic.sarisari.design/`. A visitor submits their
details + a URL; the `/api/scorecard-request` route captures the lead to Attio
and, in a background `after()` job, runs FireCrawl → Claude → Resend to email a
generated scorecard. See `src/app/api/scorecard-request/route.ts`,
`src/lib/scorecard/{pipeline,analyze,email,types}.ts`.

Two gaps prompted this work:

1. **Nothing is persisted.** The emailed HTML is the only artifact. That blocks
   three things the owner wants: learning from results over time, the 90-day
   re-score named in the Operating Doc, and any guardrail around repeat runs.
2. **No validation.** The Phase 2 pipeline fails **silently** — every error is
   caught and only `console.error`'d, while the visitor always sees "your
   scorecard is on its way." A broken Resend domain or bad key is invisible in
   the UI. Only tests + monitoring can answer "is it actually working?"

Current repeat-submission behavior is a **hard dedupe**: if an email already has
a scorecard note in Attio, the modal shows "you already got one" and never
re-analyzes (`route.ts` `alreadyRequested`). This design replaces that with a
URL-keyed cache + cooldown.

## Goals

- Persist every generated scorecard in a queryable store for learning.
- Enable the 90-day re-score with a before/after delta per URL.
- Add a cost/anti-gaming guardrail: serve a cached result within a cooldown;
  only re-score after it.
- Ship a validation suite (fast mocked tests + a live post-deploy smoke test).

## Non-goals

- No in-app dashboard for browsing scorecards — the Supabase table UI covers
  "learn by eyeballing rows."
- No queue/QStash migration — keep the existing `after()` background model.
- No hosted per-result web page — email remains the only client-facing artifact.
- No locking for the rare concurrent-submit race (see Edge cases).

## Decisions (resolved during brainstorming)

| Question | Decision |
|---|---|
| Repeat-submission behavior | Serve the stored result within a cooldown; re-score only after it. |
| Scorecard identity / compare key | **Normalized URL.** Email is lead + delivery only. |
| Datastore | **Supabase Postgres** (browsable dashboard for learning). |
| Who sees the re-score delta | Store always; show the client "went from X to Y" **only if it improved** (`delta > 0`). |
| Cooldown length | Default **30 days**, env-configurable (`SCORECARD_COOLDOWN_DAYS`). |
| Within-cooldown, different email | Re-send the stored result to them (no LLM call). |
| Within-cooldown, same email | Show existing "already sent, check your inbox" state; no re-send. |

## Data model

Supabase Postgres, single table `scorecards` — one row per run; history is
multiple rows for the same `url`.

| column | type | notes |
|---|---|---|
| `id` | uuid pk (default `gen_random_uuid()`) | |
| `url` | text, not null | normalized full URL — cache/cooldown/compare key |
| `domain` | text, not null | for grouping/browsing |
| `email` | text, not null | lead who triggered this run |
| `name` | text | |
| `company` | text | |
| `stage` | text | |
| `overall_score` | int, not null | denormalized from `result` for easy querying |
| `result` | jsonb, not null | full `ScorecardResult` (dimensions + 5 findings) |
| `previous_score` | int, null | last score for this URL at time of this run |
| `delta` | int, null | `overall_score − previous_score` |
| `served_from_cache` | bool, not null default false | fresh analysis vs cache re-send |
| `created_at` | timestamptz, not null default `now()` | |

Indexes: `(url, created_at desc)` for "latest for URL"; `(domain)` for browsing.

Migration committed as a `.sql` file (e.g. `supabase/migrations/0001_scorecards.sql`),
run once in the Supabase SQL editor.

## Storage boundary

A `scorecardStore` module (`src/lib/scorecard/store.ts`) exposing a small
interface:

- `latestForUrl(url: string): Promise<StoredScorecard | null>` — cooldown + delta source
- `hasRowForUrlEmail(url: string, email: string): Promise<boolean>` — same-person guard
- `insert(row: NewScorecard): Promise<void>`

Supabase (`@supabase/supabase-js`, service-role key, server-side) is the
production implementation. Tests use an in-memory fake implementing the same
interface, so Tier 1 runs with no network.

## Request flow

Replaces the Attio-note dedupe with URL-keyed cooldown. **Attio lead capture is
unchanged** and still runs per email (best-effort).

1. Validate payload; honeypot short-circuits (unchanged).
2. Capture lead to Attio, best-effort (unchanged).
3. `store.latestForUrl(normalizedUrl)`.
4. **Within cooldown** (`now − latest.created_at < SCORECARD_COOLDOWN_DAYS`):
   - **Requesting email already has a row for this URL** → return the "already
     sent" (`duplicate`) state; no re-send, no LLM. (Don't spam the same person.)
   - **Email new to this URL** → `after()`: re-render the **stored** `result` and
     email it to this lead; insert a `served_from_cache = true` row. No FireCrawl/Claude.
5. **No prior row, or older than cooldown** → `after()`: run FireCrawl → Claude,
   compute `previous_score`/`delta` from the prior row (if any), insert a fresh
   row, email the result. The email shows the delta only when `delta > 0`.

Route response stays `{ ok, duplicate }` shaped; add `cached` where useful. The
modal's existing `done` / `duplicate` / `error` states are sufficient.

## Error handling & guardrails

All fail-open — a lead is never lost:

- Only **successful** analyses are stored → the cache never serves a broken result.
- Analysis fails after a cache-miss → no row written, lead captured, logged; the
  next submit retries naturally (no poisoned cache).
- Supabase **read** fails → treat as cache-miss and analyze (fail open).
- Supabase **write** fails → email still sends; row is skipped and logged.
- Missing FireCrawl/Anthropic/Resend keys → `analysisConfigured()` short-circuits
  (unchanged); no email, no throw.
- Any FireCrawl/Claude/Resend error → swallowed and logged; route still returned
  `200` synchronously.

### Edge cases
- **Concurrent submits** for one URL within seconds both miss the cache and both
  analyze. Rare and harmless; no lock (YAGNI). Noted, not handled.

## Configuration / provisioning

New env vars (server-side only; add to `.env.example`, `.env.local`, and Vercel):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SCORECARD_COOLDOWN_DAYS` (optional, default `30`)

New dependency: `@supabase/supabase-js`.

## Testing

### Tier 1 — Vitest, mocked, deterministic, CI
Runs against the in-memory store and mocked `fetch`/Anthropic. No cost, no network.

- Cache-hit, same email → `duplicate` state, no LLM, no re-send.
- Cache-hit, different email → re-send cached, no LLM, `served_from_cache` row inserted.
- Cache-miss / expired → analysis runs, row stored, `previous_score`/`delta` computed.
- Delta gating → prior 60 / new 72 emails "went from 60 to 72"; prior 72 / new 65
  hides the delta line but still stores `delta = −7`.
- Email builder → `from` = `scorecard@sarisari.design` (or `RESEND_FROM`), correct
  `to`/`subject`, HTML contains the score and all 5 findings.
- Graceful degradation → missing keys (no email, no throw); FireCrawl/Claude/Resend
  failure swallowed; route still `200`.
- Route contract → invalid fields `400`; honeypot `200` no-op; URL normalization
  (`acme.com` → `https://acme.com/`, junk rejected).
- Store failure → read fail-open (analyze); write fail (email still sends).

### Tier 2 — live post-deploy smoke test, on-demand
One script (e.g. `scripts/smoke-scorecard.mjs`) run after deploy or on a cron:

- POST to `https://activation-diagnostic.sarisari.design/api/scorecard-request`
  with a unique `zach+sc-<timestamp>@…` email (so the cooldown never blocks it)
  and a known URL → assert `200 { ok: true }`.
- Poll the Resend API for that send → assert delivered + correct `from`.
- Query Supabase for a fresh row for that URL → assert it exists.

Proves keys, Resend domain verification, Vercel function duration, and Supabase
connectivity end to end — the things Tier 1 mocks can't.

## Monitoring (recommendation, not built here)

Because Phase 2 fails silently, add either a daily Tier-2 synthetic run or a
Vercel log alert on `[scorecard] analysis/email failed`. A passing test suite
won't catch a Resend domain that expires next month.

## Rollout

1. Provision Supabase; run the migration; set env vars in Vercel (Production +
   Preview) and `.env.local`.
2. Ship storage + cooldown behind the same `after()` model.
3. Land Tier 1 in CI; run Tier 2 against the deploy to confirm the live chain.
