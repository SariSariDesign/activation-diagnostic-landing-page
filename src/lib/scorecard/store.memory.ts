import type { NewScorecard, ScorecardStore, StoredScorecard } from "./store";

/**
 * Test double for ScorecardStore. Deterministic ordering: rows carry an
 * incrementing counter so `latestForUrl` doesn't depend on wall-clock time.
 */
export function createInMemoryStore(
  seed: StoredScorecard[] = [],
): ScorecardStore & { rows: StoredScorecard[] } {
  const rows: StoredScorecard[] = [...seed];
  let seq = rows.length;

  return {
    rows,
    async latestForUrl(url) {
      const matches = rows.filter((r) => r.url === url);
      return matches.length ? matches[matches.length - 1] : null;
    },
    async hasRowForUrlEmail(url, email) {
      return rows.some((r) => r.url === url && r.email === email);
    },
    async insert(row: NewScorecard) {
      const saved: StoredScorecard = {
        ...row,
        id: `mem-${++seq}`,
        createdAt: new Date(2026, 0, 1, 0, 0, seq).toISOString(),
      };
      rows.push(saved);
      return saved;
    },
  };
}
