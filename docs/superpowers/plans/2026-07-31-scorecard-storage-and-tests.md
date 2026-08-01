# Activation Scorecard Storage & Validation Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every generated Activation Scorecard in Supabase (URL-keyed) with a 30-day cache/cooldown, post-cooldown re-score + improvement-gated delta, and a two-tier test suite (mocked Vitest + a live smoke script).

**Architecture:** A `ScorecardStore` interface (Supabase impl in prod, in-memory fake in tests) records one row per run. A pure `decideScorecardAction` helper chooses duplicate / serve-cached / re-analyze from the latest stored row for a URL. The existing `after()` background pipeline is extended to compute a delta, store the row, and send a gated email. Attio lead capture is unchanged.

**Tech Stack:** Next.js 15 (App Router, Node runtime), TypeScript (moduleResolution: Bundler, `@/*` → `./src/*`), Vitest, `@supabase/supabase-js`, Zod, Anthropic SDK, FireCrawl + Resend via `fetch`.

## Global Constraints

- Server-only secrets: no `NEXT_PUBLIC_` prefix on `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCORECARD_COOLDOWN_DAYS`.
- Everything fails **open**: a store or analysis error must never lose the lead or throw out of `after()`; log and continue.
- Only **successful** analyses are stored (never cache a broken result).
- Compare/cooldown key is the **normalized URL** (`parseUrl().url`), not the domain or email.
- Delta is **always stored**; shown to the client only when `delta > 0`.
- Cooldown default is **30 days**, overridable via `SCORECARD_COOLDOWN_DAYS`.
- Email `from` stays `process.env.RESEND_FROM ?? "Sari Sari Design <scorecard@sarisari.design>"`.
- Import via the `@/` alias (e.g. `@/lib/scorecard/store`), matching the codebase.
- Commit after every task.

---

### Task 1: Vitest test harness

**Files:**
- Modify: `package.json` (add devDeps + scripts)
- Create: `vitest.config.ts`
- Create: `src/lib/scorecard/harness.test.ts` (temporary smoke test, deleted in this task's last step)

**Interfaces:**
- Produces: an `npm test` command (Vitest, `node` environment) that later tasks use.

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest@^2
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

In the `"scripts"` block add:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Write a temporary smoke test**

Create `src/lib/scorecard/harness.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest harness", () => {
  it("runs and resolves the @ alias imports later", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/lib/scorecard/harness.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add Vitest harness for scorecard suite"
```

---

### Task 2: Store interface, types, and in-memory fake

**Files:**
- Create: `src/lib/scorecard/store.ts`
- Create: `src/lib/scorecard/store.memory.ts`
- Test: `src/lib/scorecard/store.memory.test.ts`

**Interfaces:**
- Consumes: `ScorecardResult` from `@/lib/scorecard/types`.
- Produces:
  - `type StoredScorecard = { id: string; url: string; domain: string; email: string; name: string; company: string; stage: string; overallScore: number; result: ScorecardResult; previousScore: number | null; delta: number | null; servedFromCache: boolean; createdAt: string }`
  - `type NewScorecard = Omit<StoredScorecard, "id" | "createdAt">`
  - `interface ScorecardStore { latestForUrl(url: string): Promise<StoredScorecard | null>; hasRowForUrlEmail(url: string, email: string): Promise<boolean>; insert(row: NewScorecard): Promise<StoredScorecard> }`
  - `createInMemoryStore(seed?: StoredScorecard[]): ScorecardStore & { rows: StoredScorecard[] }`

- [ ] **Step 1: Write the store interface + types**

Create `src/lib/scorecard/store.ts`:
```ts
import type { ScorecardResult } from "./types";

/** One persisted scorecard run. `url` is the cache/cooldown/compare key. */
export type StoredScorecard = {
  id: string;
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

export type NewScorecard = Omit<StoredScorecard, "id" | "createdAt">;

/** Persistence boundary. Supabase in prod; in-memory fake in tests. */
export interface ScorecardStore {
  /** Most recent row for a URL, or null. Drives cooldown + delta. */
  latestForUrl(url: string): Promise<StoredScorecard | null>;
  /** True if this email already has any row for this URL. */
  hasRowForUrlEmail(url: string, email: string): Promise<boolean>;
  /** Persist a run; returns the stored row (with id + createdAt). */
  insert(row: NewScorecard): Promise<StoredScorecard>;
}
```

- [ ] **Step 2: Write the failing in-memory-fake test**

Create `src/lib/scorecard/store.memory.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createInMemoryStore } from "./store.memory";
import type { NewScorecard } from "./store";
import { SAMPLE_SCORECARD } from "./types";

function row(over: Partial<NewScorecard> = {}): NewScorecard {
  return {
    url: "https://acme.com/",
    domain: "acme.com",
    email: "a@acme.com",
    name: "A",
    company: "Acme",
    stage: "Seed",
    overallScore: SAMPLE_SCORECARD.overallScore,
    result: SAMPLE_SCORECARD,
    previousScore: null,
    delta: null,
    servedFromCache: false,
    ...over,
  };
}

describe("in-memory store", () => {
  it("returns null when no rows exist for a url", async () => {
    const store = createInMemoryStore();
    expect(await store.latestForUrl("https://acme.com/")).toBeNull();
  });

  it("latestForUrl returns the most recently inserted row for that url", async () => {
    const store = createInMemoryStore();
    await store.insert(row({ overallScore: 60 }));
    await store.insert(row({ overallScore: 72 }));
    await store.insert(row({ url: "https://other.com/", overallScore: 10 }));
    const latest = await store.latestForUrl("https://acme.com/");
    expect(latest?.overallScore).toBe(72);
  });

  it("hasRowForUrlEmail matches on url + email", async () => {
    const store = createInMemoryStore();
    await store.insert(row({ email: "a@acme.com" }));
    expect(await store.hasRowForUrlEmail("https://acme.com/", "a@acme.com")).toBe(true);
    expect(await store.hasRowForUrlEmail("https://acme.com/", "b@acme.com")).toBe(false);
    expect(await store.hasRowForUrlEmail("https://other.com/", "a@acme.com")).toBe(false);
  });

  it("insert returns a row with id and createdAt", async () => {
    const store = createInMemoryStore();
    const saved = await store.insert(row());
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- store.memory`
Expected: FAIL ("Cannot find module './store.memory'").

- [ ] **Step 4: Implement the in-memory fake**

Create `src/lib/scorecard/store.memory.ts`:
```ts
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
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- store.memory`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scorecard/store.ts src/lib/scorecard/store.memory.ts src/lib/scorecard/store.memory.test.ts
git commit -m "feat: scorecard store interface + in-memory fake"
```

---

### Task 2b: Cache-decision helper

**Files:**
- Create: `src/lib/scorecard/decide.ts`
- Test: `src/lib/scorecard/decide.test.ts`

**Interfaces:**
- Consumes: `ScorecardStore`, `StoredScorecard` from `@/lib/scorecard/store`.
- Produces:
  - `type ScorecardAction = { kind: "duplicate" } | { kind: "cached"; cached: StoredScorecard } | { kind: "analyze"; previous: StoredScorecard | null }`
  - `cooldownDays(): number` (reads `SCORECARD_COOLDOWN_DAYS`, default 30)
  - `decideScorecardAction(args: { store: ScorecardStore; url: string; email: string; now?: number; cooldownDays?: number }): Promise<ScorecardAction>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/scorecard/decide.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- decide`
Expected: FAIL ("Cannot find module './decide'").

- [ ] **Step 3: Implement the helper**

Create `src/lib/scorecard/decide.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- decide`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scorecard/decide.ts src/lib/scorecard/decide.test.ts
git commit -m "feat: scorecard cache/cooldown decision helper"
```

---

### Task 3: Gated delta in the email renderer

**Files:**
- Modify: `src/lib/scorecard/email.ts`
- Test: `src/lib/scorecard/email.test.ts`

**Interfaces:**
- Consumes: `ScorecardResult`, `ScorecardLead`.
- Produces (changed signatures):
  - `renderScorecardEmailHtml(lead: ScorecardLead, result: ScorecardResult, opts?: { delta?: number | null }): string`
  - `sendScorecardEmail(lead: ScorecardLead, result: ScorecardResult, opts?: { delta?: number | null }): Promise<void>`
  - Behavior: a delta banner ("Your score improved from X to Y") renders **only** when `opts.delta != null && opts.delta > 0`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/scorecard/email.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderScorecardEmailHtml, sendScorecardEmail } from "./email";
import type { ScorecardLead } from "./pipeline";
import { SAMPLE_SCORECARD } from "./types";

const lead: ScorecardLead = {
  name: "Jane Doe", company: "Acme", email: "jane@acme.com",
  stage: "Seed", url: "https://acme.com/", domain: "acme.com",
};

afterEach(() => vi.unstubAllGlobals());

describe("renderScorecardEmailHtml", () => {
  it("includes the score and all five findings", () => {
    const html = renderScorecardEmailHtml(lead, SAMPLE_SCORECARD);
    expect(html).toContain(String(SAMPLE_SCORECARD.overallScore));
    for (const f of SAMPLE_SCORECARD.topFindings) expect(html).toContain(f.title);
  });

  it("shows an improvement banner only when delta > 0", () => {
    const up = renderScorecardEmailHtml(lead, { ...SAMPLE_SCORECARD, overallScore: 72 }, { delta: 12 });
    expect(up).toMatch(/improved/i);
    expect(up).toContain("60"); // 72 - 12
    const down = renderScorecardEmailHtml(lead, SAMPLE_SCORECARD, { delta: -7 });
    expect(down).not.toMatch(/improved/i);
    const none = renderScorecardEmailHtml(lead, SAMPLE_SCORECARD, { delta: null });
    expect(none).not.toMatch(/improved/i);
  });
});

describe("sendScorecardEmail", () => {
  it("posts to Resend with the right from/to/subject", async () => {
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.RESEND_FROM;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    await sendScorecardEmail(lead, SAMPLE_SCORECARD);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body);
    expect(body.from).toBe("Sari Sari Design <scorecard@sarisari.design>");
    expect(body.to).toEqual(["jane@acme.com"]);
    expect(body.subject).toContain(String(SAMPLE_SCORECARD.overallScore));
  });

  it("throws when Resend returns a non-2xx (so the pipeline logs it)", async () => {
    process.env.RESEND_API_KEY = "re_test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "domain not verified" }));
    await expect(sendScorecardEmail(lead, SAMPLE_SCORECARD)).rejects.toThrow(/Resend send failed: 403/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- email`
Expected: FAIL (the delta-banner assertion; `renderScorecardEmailHtml` currently takes 2 args).

- [ ] **Step 3: Add the gated banner + opts params**

In `src/lib/scorecard/email.ts`, change the `renderScorecardEmailHtml` signature and inject a banner after the score block.

Change the function signature:
```ts
export function renderScorecardEmailHtml(
  lead: ScorecardLead,
  result: ScorecardResult,
  opts: { delta?: number | null } = {},
): string {
```

Immediately after the existing score `<div>…/ 100</div>` block, insert:
```ts
  const improved = opts.delta != null && opts.delta > 0;
  const deltaBanner = improved
    ? `<div style="background:${C.primarySoft};border-radius:10px;padding:10px 14px;margin-bottom:20px;font-size:13px;color:${C.primary};">
         Your score improved from ${result.overallScore - (opts.delta as number)} to ${result.overallScore} since your last check.
       </div>`
    : "";
```
Then place `${deltaBanner}` into the returned template, on the line directly after the score block and before the `<h2>` headline.

- [ ] **Step 4: Thread `opts` through `sendScorecardEmail`**

Change its signature and the render call:
```ts
export async function sendScorecardEmail(
  lead: ScorecardLead,
  result: ScorecardResult,
  opts: { delta?: number | null } = {},
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const from = process.env.RESEND_FROM ?? "Sari Sari Design <scorecard@sarisari.design>";
  const html = renderScorecardEmailHtml(lead, result, opts);
```
(The rest of the function — the `fetch` to `RESEND_ENDPOINT` and the non-ok throw — is unchanged.)

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- email`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scorecard/email.ts src/lib/scorecard/email.test.ts
git commit -m "feat: gated improvement delta in scorecard email"
```

---

### Task 4: Pipeline — analyze → store → gated email, and cached re-send

**Files:**
- Modify: `src/lib/scorecard/pipeline.ts`
- Test: `src/lib/scorecard/pipeline.test.ts`

**Interfaces:**
- Consumes: `analyzeUrl` (`@/lib/scorecard/analyze`), `sendScorecardEmail` (`@/lib/scorecard/email`), `ScorecardStore`/`StoredScorecard`/`NewScorecard` (`@/lib/scorecard/store`), `ScorecardResult` (`@/lib/scorecard/types`).
- Produces:
  - `type PipelineDeps = { store: ScorecardStore; previous: StoredScorecard | null; analyze?: (url: string) => Promise<ScorecardResult>; sendEmail?: (lead: ScorecardLead, result: ScorecardResult, opts?: { delta?: number | null }) => Promise<void> }`
  - `runAnalysisAndEmail(lead: ScorecardLead, deps: PipelineDeps): Promise<void>` — analyze, compute delta from `deps.previous`, insert a fresh row (`servedFromCache:false`), send gated email.
  - `sendCachedScorecard(lead: ScorecardLead, cached: StoredScorecard, deps: { store: ScorecardStore; sendEmail?: ... }): Promise<void>` — re-send stored `result` (no delta banner), insert a `servedFromCache:true` row.
  - `analysisConfigured()` unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/lib/scorecard/pipeline.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAnalysisAndEmail, sendCachedScorecard } from "./pipeline";
import type { ScorecardLead } from "./pipeline";
import { createInMemoryStore } from "./store.memory";
import type { StoredScorecard } from "./store";
import { SAMPLE_SCORECARD } from "./types";

const lead: ScorecardLead = {
  name: "Jane Doe", company: "Acme", email: "jane@acme.com",
  stage: "Seed", url: "https://acme.com/", domain: "acme.com",
};

beforeEach(() => {
  process.env.FIRECRAWL_API_KEY = "fc";
  process.env.ANTHROPIC_API_KEY = "an";
  process.env.RESEND_API_KEY = "re";
});

function stored(over: Partial<StoredScorecard>): StoredScorecard {
  return {
    id: "p", url: lead.url, domain: lead.domain, email: "old@acme.com",
    name: "Old", company: "Acme", stage: "Seed", overallScore: 60,
    result: SAMPLE_SCORECARD, previousScore: null, delta: null,
    servedFromCache: false, createdAt: "2026-01-01T00:00:00Z", ...over,
  };
}

describe("runAnalysisAndEmail", () => {
  it("first run: stores a row with null delta and emails without a banner", async () => {
    const store = createInMemoryStore();
    const analyze = vi.fn().mockResolvedValue({ ...SAMPLE_SCORECARD, overallScore: 70 });
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await runAnalysisAndEmail(lead, { store, previous: null, analyze, sendEmail });

    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ overallScore: 70, previousScore: null, delta: null, servedFromCache: false, email: "jane@acme.com" });
    expect(sendEmail).toHaveBeenCalledWith(lead, expect.objectContaining({ overallScore: 70 }), { delta: null });
  });

  it("re-score: computes delta from previous and passes it to the email", async () => {
    const store = createInMemoryStore();
    const analyze = vi.fn().mockResolvedValue({ ...SAMPLE_SCORECARD, overallScore: 72 });
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await runAnalysisAndEmail(lead, { store, previous: stored({ overallScore: 60 }), analyze, sendEmail });

    expect(store.rows[0]).toMatchObject({ overallScore: 72, previousScore: 60, delta: 12 });
    expect(sendEmail).toHaveBeenCalledWith(lead, expect.anything(), { delta: 12 });
  });

  it("skips entirely when keys are missing (no throw, no store write)", async () => {
    delete process.env.RESEND_API_KEY;
    const store = createInMemoryStore();
    const analyze = vi.fn();
    await runAnalysisAndEmail(lead, { store, previous: null, analyze });
    expect(analyze).not.toHaveBeenCalled();
    expect(store.rows).toHaveLength(0);
  });

  it("swallows an analysis error without throwing or storing", async () => {
    const store = createInMemoryStore();
    const analyze = vi.fn().mockRejectedValue(new Error("firecrawl 500"));
    const sendEmail = vi.fn();
    await expect(runAnalysisAndEmail(lead, { store, previous: null, analyze, sendEmail })).resolves.toBeUndefined();
    expect(store.rows).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("still emails when the store write fails (lead not lost)", async () => {
    const store = createInMemoryStore();
    store.insert = vi.fn().mockRejectedValue(new Error("db write down"));
    const analyze = vi.fn().mockResolvedValue({ ...SAMPLE_SCORECARD, overallScore: 70 });
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await expect(runAnalysisAndEmail(lead, { store, previous: null, analyze, sendEmail })).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe("sendCachedScorecard", () => {
  it("re-sends the stored result with no banner and records a cache row", async () => {
    const store = createInMemoryStore();
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    await sendCachedScorecard(lead, stored({ overallScore: 65 }), { store, sendEmail });
    expect(sendEmail).toHaveBeenCalledWith(lead, expect.objectContaining({ overallScore: 65 }), { delta: null });
    expect(store.rows[0]).toMatchObject({ servedFromCache: true, email: "jane@acme.com", overallScore: 65 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- pipeline`
Expected: FAIL (`sendCachedScorecard` not exported; `runAnalysisAndEmail` has the old 1-arg signature).

- [ ] **Step 3: Rewrite `pipeline.ts`**

Replace the file body with:
```ts
import { analyzeUrl } from "./analyze";
import { sendScorecardEmail } from "./email";
import type { ScorecardResult } from "./types";
import type { NewScorecard, ScorecardStore, StoredScorecard } from "./store";

/** The captured lead, passed from the submit route to the background job. */
export type ScorecardLead = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  domain: string;
};

type SendEmail = (
  lead: ScorecardLead,
  result: ScorecardResult,
  opts?: { delta?: number | null },
) => Promise<void>;

export type PipelineDeps = {
  store: ScorecardStore;
  previous: StoredScorecard | null;
  analyze?: (url: string) => Promise<ScorecardResult>;
  sendEmail?: SendEmail;
};

/** True when every credential the analysis engine needs is configured. */
export function analysisConfigured(): boolean {
  return Boolean(
    process.env.FIRECRAWL_API_KEY &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.RESEND_API_KEY,
  );
}

function baseRow(lead: ScorecardLead, result: ScorecardResult): Omit<NewScorecard, "previousScore" | "delta" | "servedFromCache"> {
  return {
    url: lead.url,
    domain: lead.domain,
    email: lead.email,
    name: lead.name,
    company: lead.company,
    stage: lead.stage,
    overallScore: result.overallScore,
    result,
  };
}

/**
 * Background job: analyze the URL, store the run, and email the scorecard.
 * Throws are logged, never surfaced — the lead was already captured. The store
 * write is best-effort: a DB failure still lets the email go out.
 */
export async function runAnalysisAndEmail(
  lead: ScorecardLead,
  deps: PipelineDeps,
): Promise<void> {
  if (!analysisConfigured()) {
    console.warn(
      "[scorecard] analysis skipped — missing FIRECRAWL/ANTHROPIC/RESEND keys:",
      lead.email,
    );
    return;
  }
  const analyze = deps.analyze ?? analyzeUrl;
  const sendEmail = deps.sendEmail ?? sendScorecardEmail;
  try {
    const result = await analyze(lead.url);
    const previousScore = deps.previous?.overallScore ?? null;
    const delta = previousScore == null ? null : result.overallScore - previousScore;

    // Store first, but never let a DB failure block delivery.
    try {
      await deps.store.insert({ ...baseRow(lead, result), previousScore, delta, servedFromCache: false });
    } catch (err) {
      console.error(`[scorecard] store write failed for ${lead.email}:`, err);
    }

    await sendEmail(lead, result, { delta });
    console.log(`[scorecard] delivered to ${lead.email} (${result.overallScore}/100, delta ${delta ?? "n/a"})`);
  } catch (err) {
    console.error(`[scorecard] analysis/email failed for ${lead.email}:`, err);
  }
}

/**
 * Re-send a cached scorecard to a new requester within the cooldown. No LLM
 * call; no delta banner (this isn't a re-score). Records a cache row.
 */
export async function sendCachedScorecard(
  lead: ScorecardLead,
  cached: StoredScorecard,
  deps: { store: ScorecardStore; sendEmail?: SendEmail },
): Promise<void> {
  const sendEmail = deps.sendEmail ?? sendScorecardEmail;
  try {
    try {
      await deps.store.insert({ ...baseRow(lead, cached.result), previousScore: null, delta: null, servedFromCache: true });
    } catch (err) {
      console.error(`[scorecard] cache-row write failed for ${lead.email}:`, err);
    }
    await sendEmail(lead, cached.result, { delta: null });
    console.log(`[scorecard] cached scorecard re-sent to ${lead.email} (${cached.overallScore}/100)`);
  } catch (err) {
    console.error(`[scorecard] cached send failed for ${lead.email}:`, err);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- pipeline`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scorecard/pipeline.ts src/lib/scorecard/pipeline.test.ts
git commit -m "feat: pipeline stores runs, computes delta, re-sends cached"
```

---

### Task 5: Supabase store implementation + migration + env

**Files:**
- Create: `src/lib/scorecard/supabaseStore.ts`
- Create: `supabase/migrations/0001_scorecards.sql`
- Modify: `.env.example`
- Test: `src/lib/scorecard/supabaseStore.test.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `ScorecardStore`/`NewScorecard`/`StoredScorecard`.
- Produces:
  - `createSupabaseStore(): ScorecardStore` — throws if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are missing.
  - `getScorecardStore(): ScorecardStore` — the factory the route uses.

- [ ] **Step 1: Install the client**

Run:
```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/0001_scorecards.sql`:
```sql
create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  domain text not null,
  email text not null,
  name text,
  company text,
  stage text,
  overall_score int not null,
  result jsonb not null,
  previous_score int,
  delta int,
  served_from_cache boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists scorecards_url_created_idx on public.scorecards (url, created_at desc);
create index if not exists scorecards_domain_idx on public.scorecards (domain);
```

- [ ] **Step 3: Write the failing test (row ⇄ record mapping)**

Create `src/lib/scorecard/supabaseStore.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { rowToStored, storedToRow } from "./supabaseStore";
import { SAMPLE_SCORECARD } from "./types";

describe("supabase row mapping", () => {
  it("maps a db row (snake_case) to a StoredScorecard (camelCase)", () => {
    const s = rowToStored({
      id: "abc", url: "https://acme.com/", domain: "acme.com",
      email: "a@acme.com", name: "A", company: "Acme", stage: "Seed",
      overall_score: 72, result: SAMPLE_SCORECARD,
      previous_score: 60, delta: 12, served_from_cache: false,
      created_at: "2026-07-10T00:00:00Z",
    });
    expect(s).toMatchObject({ id: "abc", overallScore: 72, previousScore: 60, delta: 12, servedFromCache: false, createdAt: "2026-07-10T00:00:00Z" });
  });

  it("maps a NewScorecard to an insert payload (camelCase → snake_case)", () => {
    const payload = storedToRow({
      url: "https://acme.com/", domain: "acme.com", email: "a@acme.com",
      name: "A", company: "Acme", stage: "Seed", overallScore: 72,
      result: SAMPLE_SCORECARD, previousScore: 60, delta: 12, servedFromCache: true,
    });
    expect(payload).toMatchObject({ overall_score: 72, previous_score: 60, delta: 12, served_from_cache: true });
    expect(payload).not.toHaveProperty("overallScore");
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm test -- supabaseStore`
Expected: FAIL ("Cannot find module './supabaseStore'").

- [ ] **Step 5: Implement the Supabase store**

Create `src/lib/scorecard/supabaseStore.ts`:
```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewScorecard, ScorecardStore, StoredScorecard } from "./store";
import type { ScorecardResult } from "./types";

type Row = {
  id: string;
  url: string;
  domain: string;
  email: string;
  name: string | null;
  company: string | null;
  stage: string | null;
  overall_score: number;
  result: ScorecardResult;
  previous_score: number | null;
  delta: number | null;
  served_from_cache: boolean;
  created_at: string;
};

export function rowToStored(r: Row): StoredScorecard {
  return {
    id: r.id, url: r.url, domain: r.domain, email: r.email,
    name: r.name ?? "", company: r.company ?? "", stage: r.stage ?? "",
    overallScore: r.overall_score, result: r.result,
    previousScore: r.previous_score, delta: r.delta,
    servedFromCache: r.served_from_cache, createdAt: r.created_at,
  };
}

export function storedToRow(n: NewScorecard) {
  return {
    url: n.url, domain: n.domain, email: n.email, name: n.name,
    company: n.company, stage: n.stage, overall_score: n.overallScore,
    result: n.result, previous_score: n.previousScore, delta: n.delta,
    served_from_cache: n.servedFromCache,
  };
}

export function createSupabaseStore(client?: SupabaseClient): ScorecardStore {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!client && (!url || !key)) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  const db = client ?? createClient(url!, key!, { auth: { persistSession: false } });

  return {
    async latestForUrl(u) {
      const { data, error } = await db
        .from("scorecards").select("*")
        .eq("url", u).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      return data && data.length ? rowToStored(data[0] as Row) : null;
    },
    async hasRowForUrlEmail(u, email) {
      const { count, error } = await db
        .from("scorecards").select("id", { count: "exact", head: true })
        .eq("url", u).eq("email", email);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    async insert(row: NewScorecard) {
      const { data, error } = await db
        .from("scorecards").insert(storedToRow(row)).select("*").single();
      if (error) throw error;
      return rowToStored(data as Row);
    },
  };
}

let cached: ScorecardStore | null = null;
/** Process-wide singleton store used by the route. */
export function getScorecardStore(): ScorecardStore {
  if (!cached) cached = createSupabaseStore();
  return cached;
}
```

- [ ] **Step 6: Update `.env.example`**

Under the Phase 2 block in `.env.example`, add:
```bash
# --- Scorecard persistence (Supabase) --------------------------------------
# Stores every generated scorecard for learning + the 90-day re-score. Keyed by
# normalized URL. Provision a Supabase project, run supabase/migrations/0001_scorecards.sql,
# and set these (server-side only). Also set in Vercel → Settings → Env Vars.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# Days a stored scorecard is served from cache before a re-score. Default 30.
SCORECARD_COOLDOWN_DAYS=
```

- [ ] **Step 7: Run to verify it passes**

Run: `npm test -- supabaseStore`
Expected: PASS, 2 tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/scorecard/supabaseStore.ts src/lib/scorecard/supabaseStore.test.ts supabase/migrations/0001_scorecards.sql .env.example
git commit -m "feat: Supabase scorecard store + migration + env"
```

---

### Task 5b: Submission parser + validation (route helpers module)

Pure helpers live in a **sibling module**, not `route.ts` — Next.js validates the exports of a route file, so `parseUrl`/`parseSubmission`/`handleScorecardSubmit` go in `handler.ts` and `route.ts` imports them.

**Files:**
- Create: `src/app/api/scorecard-request/handler.ts`
- Test: `src/app/api/scorecard-request/handler.test.ts`

**Interfaces:**
- Consumes: `ScorecardLead` (`@/lib/scorecard/pipeline`).
- Produces:
  - `parseUrl(raw: string): { url: string; domain: string } | null`
  - `type Submission = { kind: "ok"; lead: ScorecardLead } | { kind: "honeypot" } | { kind: "invalid" }`
  - `parseSubmission(body: unknown): Submission`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/scorecard-request/handler.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseUrl, parseSubmission } from "./handler";

describe("parseUrl", () => {
  it("adds https:// to a bare domain and strips www", () => {
    expect(parseUrl("acme.com")).toEqual({ url: "https://acme.com/", domain: "acme.com" });
    expect(parseUrl("https://www.acme.com/pricing")?.domain).toBe("acme.com");
  });
  it("rejects junk without a dot", () => {
    expect(parseUrl("notaurl")).toBeNull();
  });
});

describe("parseSubmission", () => {
  const valid = { name: "Jane", company: "Acme", email: "jane@acme.com", stage: "Seed", url: "acme.com" };
  it("returns ok with a normalized lead", () => {
    const s = parseSubmission(valid);
    expect(s.kind).toBe("ok");
    if (s.kind === "ok") expect(s.lead).toMatchObject({ email: "jane@acme.com", url: "https://acme.com/", domain: "acme.com" });
  });
  it("flags a filled honeypot", () => {
    expect(parseSubmission({ ...valid, faxNumber: "bot" }).kind).toBe("honeypot");
  });
  it("rejects missing or malformed fields", () => {
    expect(parseSubmission({ ...valid, email: "nope" }).kind).toBe("invalid");
    expect(parseSubmission({ ...valid, company: "" }).kind).toBe("invalid");
    expect(parseSubmission({ ...valid, url: "notaurl" }).kind).toBe("invalid");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- handler`
Expected: FAIL ("Cannot find module './handler'").

- [ ] **Step 3: Implement `handler.ts` (parse helpers only for now)**

Create `src/app/api/scorecard-request/handler.ts`:
```ts
import type { ScorecardLead } from "@/lib/scorecard/pipeline";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Normalize a possibly-bare URL and pull out its hostname (no www). */
export function parseUrl(raw: string): { url: string; domain: string } | null {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return { url: u.toString(), domain: u.hostname.replace(/^www\./i, "") };
  } catch {
    return null;
  }
}

export type Submission =
  | { kind: "ok"; lead: ScorecardLead }
  | { kind: "honeypot" }
  | { kind: "invalid" };

/** Validate + normalize a raw request body into a lead. */
export function parseSubmission(body: unknown): Submission {
  const b = (body ?? {}) as Record<string, unknown>;
  if (str(b.faxNumber)) return { kind: "honeypot" };

  const name = str(b.name);
  const company = str(b.company);
  const email = str(b.email);
  const stage = str(b.stage);
  const parsed = parseUrl(str(b.url));
  if (!name || !company || !isEmail(email) || !stage || !parsed) {
    return { kind: "invalid" };
  }
  return { kind: "ok", lead: { name, company, email, stage, url: parsed.url, domain: parsed.domain } };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- handler`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/scorecard-request/handler.ts src/app/api/scorecard-request/handler.test.ts
git commit -m "feat: extract + test scorecard submission parser"
```

---

### Task 6: Dispatcher + wire the route to the store, decision helper, and pipeline

**Files:**
- Modify: `src/app/api/scorecard-request/handler.ts` (add `handleScorecardSubmit`)
- Modify: `src/app/api/scorecard-request/route.ts` (use `parseSubmission` + `handleScorecardSubmit`)
- Test: `src/app/api/scorecard-request/dispatch.test.ts`

**Interfaces:**
- Consumes: `decideScorecardAction` (`@/lib/scorecard/decide`), `runAnalysisAndEmail`/`sendCachedScorecard`/`ScorecardLead` (`@/lib/scorecard/pipeline`), `getScorecardStore` (`@/lib/scorecard/supabaseStore`), `ScorecardStore` (`@/lib/scorecard/store`), `parseSubmission` (`./handler`).
- Produces: `handleScorecardSubmit(lead, store, schedule, overrides?)` in `handler.ts`, where `schedule(fn)` runs the background job (production passes `after`; tests pass a synchronous collector). The `POST` handler returns `{ ok, duplicate }` — `duplicate` true only for same-email-within-cooldown; new-email cache hits and re-scores return `{ ok: true, duplicate: false }`. Attio capture stays in `route.ts`, unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/scorecard-request/dispatch.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleScorecardSubmit } from "./handler";
import type { ScorecardLead } from "@/lib/scorecard/pipeline";
import { createInMemoryStore } from "@/lib/scorecard/store.memory";
import type { StoredScorecard } from "@/lib/scorecard/store";
import { SAMPLE_SCORECARD } from "@/lib/scorecard/types";

const lead: ScorecardLead = {
  name: "Jane", company: "Acme", email: "jane@acme.com",
  stage: "Seed", url: "https://acme.com/", domain: "acme.com",
};

beforeEach(() => {
  process.env.FIRECRAWL_API_KEY = "fc";
  process.env.ANTHROPIC_API_KEY = "an";
  process.env.RESEND_API_KEY = "re";
  process.env.SCORECARD_COOLDOWN_DAYS = "30";
});

function stored(over: Partial<StoredScorecard>): StoredScorecard {
  return {
    id: "s", url: lead.url, domain: lead.domain, email: "jane@acme.com",
    name: "Jane", company: "Acme", stage: "Seed", overallScore: 70,
    result: SAMPLE_SCORECARD, previousScore: null, delta: null,
    servedFromCache: false, createdAt: new Date().toISOString(), ...over,
  };
}

// Collect scheduled background jobs and run them synchronously.
function collector() {
  const jobs: Array<() => Promise<void> | void> = [];
  return { schedule: (fn: () => Promise<void> | void) => jobs.push(fn), run: () => Promise.all(jobs.map((j) => j())) };
}

it("first-time submit → analyzes and is not a duplicate", async () => {
  const store = createInMemoryStore();
  const c = collector();
  const analyze = vi.fn().mockResolvedValue({ ...SAMPLE_SCORECARD, overallScore: 70 });
  const sendEmail = vi.fn().mockResolvedValue(undefined);
  const res = await handleScorecardSubmit(lead, store, c.schedule, { analyze, sendEmail });
  await c.run();
  expect(res).toEqual({ ok: true, duplicate: false });
  expect(analyze).toHaveBeenCalledOnce();
  expect(store.rows[0]?.servedFromCache).toBe(false);
});

it("same email within cooldown → duplicate, no analysis", async () => {
  const store = createInMemoryStore([stored({ email: "jane@acme.com" })]);
  const c = collector();
  const analyze = vi.fn();
  const res = await handleScorecardSubmit(lead, store, c.schedule, { analyze, sendEmail: vi.fn() });
  await c.run();
  expect(res).toEqual({ ok: true, duplicate: true });
  expect(analyze).not.toHaveBeenCalled();
});

it("different email within cooldown → cached re-send, no analysis", async () => {
  const store = createInMemoryStore([stored({ email: "someone@else.com" })]);
  const c = collector();
  const analyze = vi.fn();
  const sendEmail = vi.fn().mockResolvedValue(undefined);
  const res = await handleScorecardSubmit(lead, store, c.schedule, { analyze, sendEmail });
  await c.run();
  expect(res).toEqual({ ok: true, duplicate: false });
  expect(analyze).not.toHaveBeenCalled();
  expect(sendEmail).toHaveBeenCalledWith(lead, expect.objectContaining({ overallScore: 70 }), { delta: null });
  expect(store.rows.at(-1)?.servedFromCache).toBe(true);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- dispatch`
Expected: FAIL (`handleScorecardSubmit` not exported from `./handler`).

- [ ] **Step 3a: Add the dispatcher to `handler.ts`**

Append to `src/app/api/scorecard-request/handler.ts` these imports (top of file) and the function:
```ts
import { decideScorecardAction } from "@/lib/scorecard/decide";
import { runAnalysisAndEmail, sendCachedScorecard } from "@/lib/scorecard/pipeline";
import type { ScorecardStore } from "@/lib/scorecard/store";
import type { ScorecardResult } from "@/lib/scorecard/types";
```
```ts
type Schedule = (fn: () => Promise<void> | void) => void;
type Overrides = {
  analyze?: (url: string) => Promise<ScorecardResult>;
  sendEmail?: (lead: ScorecardLead, result: ScorecardResult, opts?: { delta?: number | null }) => Promise<void>;
};

/**
 * Decide and dispatch the scorecard job for a validated lead. Pure w.r.t. the
 * injected store + scheduler so it's unit-testable without Next's `after()`.
 * Returns the response body the route sends back.
 */
export async function handleScorecardSubmit(
  lead: ScorecardLead,
  store: ScorecardStore,
  schedule: Schedule,
  overrides: Overrides = {},
): Promise<{ ok: true; duplicate: boolean }> {
  const action = await decideScorecardAction({ store, url: lead.url, email: lead.email });
  if (action.kind === "duplicate") return { ok: true, duplicate: true };
  if (action.kind === "cached") {
    schedule(() => sendCachedScorecard(lead, action.cached, { store, sendEmail: overrides.sendEmail }));
    return { ok: true, duplicate: false };
  }
  schedule(() => runAnalysisAndEmail(lead, { store, previous: action.previous, ...overrides }));
  return { ok: true, duplicate: false };
}
```

- [ ] **Step 3b: Rewire `route.ts` to use the handler module**

In `src/app/api/scorecard-request/route.ts`, replace the top import
```ts
import { runAnalysisAndEmail } from "@/lib/scorecard/pipeline";
```
with:
```ts
import { parseSubmission, handleScorecardSubmit } from "./handler";
import { getScorecardStore } from "@/lib/scorecard/supabaseStore";
```

Replace the whole body of `POST` — the JSON parse, honeypot, field validation, dedupe, and `after` blocks — with:
```ts
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSubmission(raw);
  if (parsed.kind === "honeypot") return NextResponse.json({ ok: true });
  if (parsed.kind === "invalid") {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  const lead = parsed.lead;

  // Best-effort CRM capture — failures are logged, not returned to the user.
  try {
    await captureToAttio(lead, { addNote: true });
  } catch (err) {
    console.error("[scorecard-request] Attio capture failed:", err);
  }

  const body = await handleScorecardSubmit(lead, getScorecardStore(), (fn) => after(fn));
  return NextResponse.json(body);
}
```

Then delete the now-unused helpers from `route.ts`: `str`, `isEmail`, `parseUrl`, `alreadyRequested`, and the `Payload` type (all moved to or superseded by `handler.ts`). Keep `attio`, `captureToAttio`, `SCORECARD_NOTE_TITLE`, `ATTIO_BASE`, and the `Lead` type. Ensure `captureToAttio` accepts the `ScorecardLead` shape (it already reads `name`/`company`/`email`/`domain`).

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- dispatch`
Expected: PASS, 3 tests.

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both succeed (no type errors; route compiles).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/scorecard-request/handler.ts src/app/api/scorecard-request/dispatch.test.ts src/app/api/scorecard-request/route.ts
git commit -m "feat: route uses URL-keyed cache/cooldown store for scorecards"
```

---

### Task 7: Live post-deploy smoke test (Tier 2)

**Files:**
- Create: `scripts/smoke-scorecard.mjs`
- Modify: `package.json` (add a `smoke:scorecard` script)

**Interfaces:**
- Consumes (env at runtime): `SMOKE_BASE_URL` (default `https://activation-diagnostic.sarisari.design`), `SMOKE_EMAIL_BASE` (e.g. `zach@sarisari.design`), `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: a runnable script that exits non-zero on any failed check.

- [ ] **Step 1: Write the smoke script**

Create `scripts/smoke-scorecard.mjs`:
```js
#!/usr/bin/env node
/**
 * Live end-to-end smoke test for the Activation Scorecard flow.
 * Run AFTER a deploy (or on a cron). Proves: the route accepts a submit, Resend
 * delivers from the right address, and a fresh Supabase row was written.
 *
 * Usage: node scripts/smoke-scorecard.mjs
 * Requires env: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.SMOKE_BASE_URL ?? "https://activation-diagnostic.sarisari.design";
const EMAIL_BASE = process.env.SMOKE_EMAIL_BASE ?? "zach@sarisari.design";
const TEST_URL = process.env.SMOKE_TARGET_URL ?? "https://www.sarisari.design";
const stamp = Date.now();
const [local, domain] = EMAIL_BASE.split("@");
const email = `${local}+sc-${stamp}@${domain}`; // unique → never blocked by cooldown

const fail = (msg) => { console.error("✗", msg); process.exitCode = 1; };
const ok = (msg) => console.log("✓", msg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1) Submit
  const res = await fetch(`${BASE}/api/scorecard-request/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Smoke Test", company: "Sari Sari", email, stage: "Seed", url: TEST_URL }),
  });
  if (res.status !== 200) return fail(`submit returned ${res.status}`);
  const body = await res.json();
  if (!body.ok) return fail(`submit body not ok: ${JSON.stringify(body)}`);
  ok(`submit accepted (${email})`);

  // 2) Supabase row (poll up to ~90s while the after() job runs)
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let row = null;
  for (let i = 0; i < 18 && !row; i++) {
    await sleep(5000);
    const { data } = await db.from("scorecards").select("*").eq("email", email).limit(1);
    if (data && data.length) row = data[0];
  }
  if (!row) return fail("no Supabase row written within ~90s");
  ok(`Supabase row written (score ${row.overall_score}/100)`);

  // 3) Resend delivery + from address
  const r = await fetch("https://api.resend.com/emails?limit=20", {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  });
  if (!r.ok) return fail(`Resend list returned ${r.status}`);
  const { data: emails } = await r.json();
  const sent = (emails ?? []).find((e) => (e.to ?? []).includes(email));
  if (!sent) return fail("no matching Resend email found");
  if (!String(sent.from).includes("scorecard@sarisari.design") && !process.env.RESEND_FROM) {
    return fail(`unexpected from address: ${sent.from}`);
  }
  ok(`email sent from ${sent.from}`);
}

main().then(() => {
  if (process.exitCode) { console.error("\nSMOKE FAILED"); }
  else console.log("\nSMOKE PASSED");
});
```

- [ ] **Step 2: Add the script alias**

In `package.json` `"scripts"`, add:
```json
    "smoke:scorecard": "node scripts/smoke-scorecard.mjs"
```

- [ ] **Step 3: Run it against production**

Run (with the three env vars exported, or via `.env.local` sourced):
```bash
npm run smoke:scorecard
```
Expected: prints `✓ submit accepted`, `✓ Supabase row written`, `✓ email sent from …scorecard@sarisari.design`, then `SMOKE PASSED`. (If the Resend `from` differs because you set `RESEND_FROM`, that check is skipped.)

Note: this is a live test — it inserts a real row and sends a real email to a plus-addressed inbox. Safe to re-run; each run uses a fresh unique email.

- [ ] **Step 4: Commit**

```bash
git add scripts/smoke-scorecard.mjs package.json
git commit -m "test: live post-deploy scorecard smoke script"
```

---

### Task 8: Full suite green + final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole unit suite**

Run: `npm test`
Expected: PASS — all files (store.memory, decide, email, pipeline, supabaseStore, handler, dispatch).

- [ ] **Step 2: Typecheck + production build**

Run: `npm run typecheck && npm run build`
Expected: both succeed. Confirm the dev-only widgets are still excluded:
```bash
grep -rl "agentation" .next/static || echo "clean (no dev widgets in prod)"
```
Expected: `clean (no dev widgets in prod)`.

- [ ] **Step 3: Commit any lockfile/build incidentals (if changed)**

```bash
git status --short
# if package-lock.json changed during installs and isn't committed yet:
git add -A && git commit -m "chore: finalize scorecard storage + tests" || echo "nothing to commit"
```

---

## Post-implementation (manual, owner)

Not code — do these to make it live:
1. Create a Supabase project; run `supabase/migrations/0001_scorecards.sql` in its SQL editor.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SCORECARD_COOLDOWN_DAYS`) in Vercel (Production + Preview) and `.env.local`.
3. Deploy, then run `npm run smoke:scorecard` to confirm the live chain.
4. (Recommended) Schedule the smoke script or add a Vercel log alert on `[scorecard] analysis/email failed` — Phase 2 fails silently otherwise.
