import { analyzeUrl } from "./analyze";
import { sendScorecardEmail } from "./email";
import { getStore, storeConfigured } from "./store.supabase";

/** The captured lead, passed from the submit route to the background job. */
export type ScorecardLead = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  domain: string;
};

/** Absolute base URL the hosted report is served from (for email links). */
export function reportBaseUrl(): string {
  return (
    process.env.SCORECARD_PUBLIC_BASE_URL ??
    "https://activation-diagnostic.sarisari.design"
  ).replace(/\/+$/, "");
}

/** True when every credential the analysis + delivery path needs is configured. */
export function analysisConfigured(): boolean {
  return Boolean(
    process.env.FIRECRAWL_API_KEY &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.RESEND_API_KEY &&
      storeConfigured(),
  );
}

/**
 * Background job: produce the scorecard for the submitted URL, persist it, and
 * email the lead a link to the hosted report page. Throws are logged, not
 * surfaced — the lead was already captured to the CRM by the time this runs, so a
 * failed analysis never loses the lead. Fails fast and loud in logs so a broken
 * key or quota is visible.
 *
 * Caching: if this URL was already scored, reuse that row (and its slug) instead
 * of re-running the slow FireCrawl + Claude pass. Cooldown/dedupe policy is
 * decided upstream (see decide.ts); this job only ensures a report exists to link.
 */
export async function runAnalysisAndEmail(lead: ScorecardLead): Promise<void> {
  if (!analysisConfigured()) {
    console.warn(
      "[scorecard] analysis skipped — missing FIRECRAWL/ANTHROPIC/RESEND/SUPABASE config:",
      lead.email,
    );
    return;
  }
  try {
    const store = getStore();

    let row = await store.latestForUrl(lead.url);
    if (!row) {
      const result = await analyzeUrl(lead.url);
      row = await store.insert({
        url: lead.url,
        domain: lead.domain,
        email: lead.email,
        name: lead.name,
        company: lead.company,
        stage: lead.stage,
        overallScore: result.overallScore,
        result,
        previousScore: null,
        delta: null,
        servedFromCache: false,
      });
    }

    const reportUrl = `${reportBaseUrl()}/s/${row.slug}`;
    await sendScorecardEmail(lead, row.result, { reportUrl, delta: row.delta });
    console.log(
      `[scorecard] delivered to ${lead.email} (${row.result.overallScore}/100) → ${reportUrl}`,
    );
  } catch (err) {
    console.error(`[scorecard] analysis/email failed for ${lead.email}:`, err);
  }
}
