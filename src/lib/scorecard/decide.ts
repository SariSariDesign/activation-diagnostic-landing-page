import type { ScorecardStore, StoredScorecard } from "./store";

export type ScorecardAction =
  | { kind: "duplicate" }
  | { kind: "cached"; cached: StoredScorecard }
  | { kind: "analyze"; previous: StoredScorecard | null };

/** Cooldown window in days; env-overridable, default 30. */
export function cooldownDays(): number {
  const raw = Number(process.env.SCORECARD_COOLDOWN_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

/**
 * Decide what a submission should do, from the latest stored row for its URL.
 * Pure except for the injected store; `now` is injectable for tests. Fails open
 * to a fresh analysis (never blocks a lead) if the store errors.
 */
export async function decideScorecardAction(args: {
  store: ScorecardStore;
  url: string;
  email: string;
  now?: number;
  cooldownDays?: number;
}): Promise<ScorecardAction> {
  const now = args.now ?? Date.now();
  const days = args.cooldownDays ?? cooldownDays();
  try {
    const latest = await args.store.latestForUrl(args.url);
    if (!latest) return { kind: "analyze", previous: null };

    const ageMs = now - new Date(latest.createdAt).getTime();
    const withinCooldown = ageMs < days * 24 * 60 * 60 * 1000;
    if (!withinCooldown) return { kind: "analyze", previous: latest };

    const seen = await args.store.hasRowForUrlEmail(args.url, args.email);
    return seen ? { kind: "duplicate" } : { kind: "cached", cached: latest };
  } catch (err) {
    console.error("[scorecard] decide failed (analyzing):", err);
    return { kind: "analyze", previous: null };
  }
}
