import type { ScorecardResult } from "./types";

/** One persisted scorecard run. `url` is the cache/cooldown/compare key. */
export type StoredScorecard = {
  id: string;
  /** Unguessable slug the hosted report is served under (/s/<slug>). */
  slug: string;
  url: string;
  domain: string;
  email: string;
  name: string;
  company: string;
  stage: string;
  overallScore: number;
  result: ScorecardResult;
  previousScore: number | null;
  delta: number | null;
  servedFromCache: boolean;
  createdAt: string; // ISO 8601
};

/** The slug is minted by the store at insert time, not supplied by the caller. */
export type NewScorecard = Omit<StoredScorecard, "id" | "slug" | "createdAt">;

/** Persistence boundary. Supabase in prod; in-memory fake in tests. */
export interface ScorecardStore {
  /** Most recent row for a URL, or null. Drives cooldown + delta. */
  latestForUrl(url: string): Promise<StoredScorecard | null>;
  /** True if this email already has any row for this URL. */
  hasRowForUrlEmail(url: string, email: string): Promise<boolean>;
  /** Persist a run; returns the stored row (with id + slug + createdAt). */
  insert(row: NewScorecard): Promise<StoredScorecard>;
  /** Fetch a run by its slug, for the hosted /s/<slug> page. */
  getBySlug(slug: string): Promise<StoredScorecard | null>;
}
