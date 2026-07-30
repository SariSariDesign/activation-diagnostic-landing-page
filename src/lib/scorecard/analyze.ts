import Anthropic from "@anthropic-ai/sdk";
import {
  scorecardJsonSchema,
  scorecardResultSchema,
  type ScorecardResult,
} from "./types";

/**
 * The automated scorecard engine: scrape + screenshot the submitted URL with
 * FireCrawl, then have Claude score it against the 11-dimension UX rubric and
 * return a structured top-5. This is a lighter, single-pass version of the
 * `ux-audit` skill — good enough for a free preview; the full audit stays the
 * paid deliverable.
 */

const FIRECRAWL_SCRAPE = "https://api.firecrawl.dev/v1/scrape";
// Model is env-overridable so you can flip Sonnet ⇄ Opus ⇄ Haiku without a code
// change. Sonnet 5 is the default: near-Opus critique quality at ~half the cost,
// with structured output + adaptive thinking + high-res vision all supported.
const MODEL = process.env.SCORECARD_MODEL ?? "claude-sonnet-5";

type PageCapture = { markdown: string; screenshotUrl: string | null };

async function scrape(url: string): Promise<PageCapture> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");

  const res = await fetch(FIRECRAWL_SCRAPE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      // Viewport (above-the-fold) screenshot for the visual — a full-page shot of a
      // long marketing page exceeds Anthropic's 8000px image limit and, once
      // downscaled to fit, renders text unreadable. Below-the-fold content is still
      // evaluated via the full-page `markdown` we also request.
      formats: ["markdown", "screenshot"],
      onlyMainContent: false,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`FireCrawl scrape failed: ${res.status} ${detail}`);
  }

  const json = (await res.json()) as {
    data?: { markdown?: string; screenshot?: string };
  };
  return {
    markdown: json.data?.markdown ?? "",
    screenshotUrl: json.data?.screenshot ?? null,
  };
}

const SYSTEM_PROMPT = `You are an expert UX auditor evaluating a landing, product, or marketing page for how well it converts and activates users. You assess against 11 dimensions grounded in Nielsen Norman Group heuristics and conversion best practices:

1. Nielsen's Heuristics
2. Conversion Rate Optimization (CTA clarity, funnel, engagement path)
3. Information Architecture (navigation, scent, structure)
4. Interaction Design (affordances, feedback, target sizing, choice load)
5. Visual & Brand Design (credibility, consistency, hierarchy)
6. Content & Copywriting (headline effectiveness, benefit framing, clarity, 5-second test)
7. Accessibility (WCAG basics, contrast, labels, alt text)
8. Performance (perceived speed, weight)
9. SEO & Discoverability (titles, meta, headings)
10. Mobile UX (touch targets, thumb zone, responsive behavior)
11. QA / Bugs (broken or inconsistent elements)

Score each dimension 0–100 and give an overall 0–100 score. Then select the TOP 5 highest-impact points of friction — the ones most likely to be costing conversions and delaying users from reaching the product's "a-ha" moment — ordered most to least impactful.

Rules:
- You MUST return exactly 5 findings in topFindings. Never return fewer than 5. If the page is strong, include lower-severity refinements and quick wins to reach five — but always deliver five.
- Be specific and cite actual elements you see (the exact CTA, section, form, headline). Never generic.
- Every recommendation must stand alone and be immediately actionable.
- All text is shown directly to a prospective client: professional, direct, no profanity, no hedging ("appears to"), no first person.
- Base findings only on the evidence provided (screenshot + page content). If something can't be evaluated, don't invent it.`;

export async function analyzeUrl(url: string): Promise<ScorecardResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const { markdown, screenshotUrl } = await scrape(url);
  const client = new Anthropic();

  const content: Anthropic.ContentBlockParam[] = [];
  if (screenshotUrl) {
    content.push({
      type: "image",
      source: { type: "url", url: screenshotUrl },
    });
  }
  content.push({
    type: "text",
    text: `Evaluate this page: ${url}\n\nCaptured page content (markdown):\n\n${markdown.slice(0, 60_000)}`,
  });

  // Structured output lets the model satisfy the schema with an empty findings
  // array, which it occasionally does. Generate once; if it comes back with fewer
  // than five findings, retry once and keep the better result. Two "medium" passes
  // stay well under the serverless ceiling (~50s worst case).
  let result = await generate(client, content);
  if (result.topFindings.length < 5) {
    console.warn(
      `[scorecard] first pass returned ${result.topFindings.length} findings — retrying`,
    );
    const retry = await generate(client, content);
    if (retry.topFindings.length > result.topFindings.length) result = retry;
  }
  return { ...result, topFindings: result.topFindings.slice(0, 5) };
}

async function generate(
  client: Anthropic,
  content: Anthropic.ContentBlockParam[],
): Promise<ScorecardResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16_000,
    // "medium" keeps latency well under the serverless ceiling while staying
    // sharp for a preview (Sonnet 5 @ medium ≈ Sonnet 4.6 @ high). Bump to "high"
    // only if you move the job to a queue with a longer budget.
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: scorecardJsonSchema } },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text output for the scorecard");
  }
  return scorecardResultSchema.parse(JSON.parse(textBlock.text));
}
