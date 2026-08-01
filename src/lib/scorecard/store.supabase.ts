import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewScorecard, ScorecardStore, StoredScorecard } from "./store";

/**
 * Supabase-backed ScorecardStore (production). Implements the shared boundary in
 * store.ts: cache/cooldown lookups by URL, per-email dedupe, insert (minting the
 * unguessable slug), and slug lookup for the hosted /s/<slug> report page.
 *
 * Table DDL lives in store.sql. NOTE (coordination): the parallel Supabase effort
 * defines the same ScorecardStore interface and in-memory fake; this is the
 * concrete adapter. Reconcile onto one table/adapter at merge time.
 */

const TABLE = "scorecard_reports";

/** Project URL, shared with the parallel Supabase setup (either env name works). */
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * True when the store's credentials are configured. Uses the SERVICE-ROLE key
 * (server-only, bypasses RLS) — NOT the publishable/anon key — because it writes
 * lead PII and reads private reports while the table stays locked to the public.
 */
export function storeConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!storeConfigured()) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY are not set",
    );
  }
  client ??= createClient(
    supabaseUrl() as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}

/** Unguessable slug: a readable company prefix plus random hex. */
function makeSlug(company: string): string {
  const prefix =
    company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "scorecard";
  const rand = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${prefix}-${rand}`;
}

/* Column names in the DB use snake_case; map to/from the camelCase domain type. */
type Row = {
  id: string;
  slug: string;
  url: string;
  domain: string;
  email: string;
  name: string;
  company: string;
  stage: string;
  overall_score: number;
  result: StoredScorecard["result"];
  previous_score: number | null;
  delta: number | null;
  served_from_cache: boolean;
  created_at: string;
};

function toStored(r: Row): StoredScorecard {
  return {
    id: r.id,
    slug: r.slug,
    url: r.url,
    domain: r.domain,
    email: r.email,
    name: r.name,
    company: r.company,
    stage: r.stage,
    overallScore: r.overall_score,
    result: r.result,
    previousScore: r.previous_score,
    delta: r.delta,
    servedFromCache: r.served_from_cache,
    createdAt: r.created_at,
  };
}

export function createSupabaseStore(): ScorecardStore {
  return {
    async latestForUrl(url) {
      const { data, error } = await db()
        .from(TABLE)
        .select("*")
        .eq("url", url)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`[scorecard-store] latestForUrl: ${error.message}`);
      return data ? toStored(data as Row) : null;
    },

    async hasRowForUrlEmail(url, email) {
      const { data, error } = await db()
        .from(TABLE)
        .select("id")
        .eq("url", url)
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`[scorecard-store] hasRowForUrlEmail: ${error.message}`);
      return Boolean(data);
    },

    async insert(row: NewScorecard) {
      const slug = makeSlug(row.company);
      const { data, error } = await db()
        .from(TABLE)
        .insert({
          slug,
          url: row.url,
          domain: row.domain,
          email: row.email,
          name: row.name,
          company: row.company,
          stage: row.stage,
          overall_score: row.overallScore,
          result: row.result,
          previous_score: row.previousScore,
          delta: row.delta,
          served_from_cache: row.servedFromCache,
        })
        .select("*")
        .single();
      if (error) throw new Error(`[scorecard-store] insert: ${error.message}`);
      return toStored(data as Row);
    },

    async getBySlug(slug) {
      const { data, error } = await db()
        .from(TABLE)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(`[scorecard-store] getBySlug: ${error.message}`);
      return data ? toStored(data as Row) : null;
    },
  };
}

/** The store used by server code: Supabase when configured. */
export function getStore(): ScorecardStore {
  return createSupabaseStore();
}
