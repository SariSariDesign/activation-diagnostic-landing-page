import { analyzeUrl } from "./analyze";
import { sendScorecardEmail } from "./email";

/** The captured lead, passed from the submit route to the background job. */
export type ScorecardLead = {
  name: string;
  company: string;
  email: string;
  stage: string;
  url: string;
  domain: string;
};

/** True when every credential the analysis engine needs is configured. */
export function analysisConfigured(): boolean {
  return Boolean(
    process.env.FIRECRAWL_API_KEY &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.RESEND_API_KEY,
  );
}

/**
 * Background job: analyze the submitted URL and email the scorecard. Throws are
 * logged, not surfaced — the lead was already captured to the CRM by the time
 * this runs, so a failed analysis never loses the lead. Fails fast and loud in
 * logs so a broken key or quota is visible.
 */
export async function runAnalysisAndEmail(lead: ScorecardLead): Promise<void> {
  if (!analysisConfigured()) {
    console.warn(
      "[scorecard] analysis skipped — missing FIRECRAWL/ANTHROPIC/RESEND keys:",
      lead.email,
    );
    return;
  }
  try {
    const result = await analyzeUrl(lead.url);
    await sendScorecardEmail(lead, result);
    console.log(`[scorecard] delivered to ${lead.email} (${result.overallScore}/100)`);
  } catch (err) {
    console.error(`[scorecard] analysis/email failed for ${lead.email}:`, err);
  }
}
