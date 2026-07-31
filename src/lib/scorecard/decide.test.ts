import { describe, it, expect } from "vitest";
import { decideScorecardAction } from "./decide";
import { createInMemoryStore } from "./store.memory";
import type { StoredScorecard } from "./store";
import { SAMPLE_SCORECARD } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function stored(over: Partial<StoredScorecard>): StoredScorecard {
  return {
    id: "1", url: "https://acme.com/", domain: "acme.com",
    email: "a@acme.com", name: "A", company: "Acme", stage: "Seed",
    overallScore: 70, result: SAMPLE_SCORECARD,
    previousScore: null, delta: null, servedFromCache: false,
    createdAt: new Date("2026-07-01T00:00:00Z").toISOString(),
    ...over,
  };
}
const now = new Date("2026-07-10T00:00:00Z").getTime(); // 9 days after seed

it("analyze when no prior row", async () => {
  const store = createInMemoryStore();
  const a = await decideScorecardAction({ store, url: "https://acme.com/", email: "a@acme.com", now });
  expect(a).toEqual({ kind: "analyze", previous: null });
});

it("duplicate when same email already has a row within cooldown", async () => {
  const store = createInMemoryStore([stored({ email: "a@acme.com" })]);
  const a = await decideScorecardAction({ store, url: "https://acme.com/", email: "a@acme.com", now });
  expect(a.kind).toBe("duplicate");
});

it("cached when a different email requests within cooldown", async () => {
  const seed = stored({ email: "a@acme.com" });
  const store = createInMemoryStore([seed]);
  const a = await decideScorecardAction({ store, url: "https://acme.com/", email: "b@acme.com", now });
  expect(a.kind).toBe("cached");
  if (a.kind === "cached") expect(a.cached.overallScore).toBe(70);
});

it("analyze (with previous) when the latest row is older than the cooldown", async () => {
  const old = stored({ createdAt: new Date("2026-01-01T00:00:00Z").toISOString(), overallScore: 65 });
  const store = createInMemoryStore([old]);
  const a = await decideScorecardAction({ store, url: "https://acme.com/", email: "a@acme.com", now, cooldownDays: 30 });
  expect(a.kind).toBe("analyze");
  if (a.kind === "analyze") expect(a.previous?.overallScore).toBe(65);
});

it("fails open to analyze when the store throws", async () => {
  const broken = {
    async latestForUrl() { throw new Error("db down"); },
    async hasRowForUrlEmail() { throw new Error("db down"); },
    async insert() { throw new Error("db down"); },
  };
  const a = await decideScorecardAction({ store: broken, url: "https://acme.com/", email: "a@acme.com", now });
  expect(a).toEqual({ kind: "analyze", previous: null });
});
