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

You also produce a few framing fields:
- bandName: a short qualitative label for where the overall score sits (e.g. "Solid foundation, fixable leaks", "Strong, a few refinements left", "Serious friction, high upside"). A name, not a number.
- bandFraming: ONE honest sentence framing the band, measured against best-practice activation patterns for the product's vertical. NEVER a percentile, ranking, or claim about a scored corpus of other companies.
- For EACH finding, whyItMatters: 1–2 sentences on the business impact, grounded in the company's stage, go-to-market motion, and conversion goal (revenue, pipeline, signups, credibility, retention). Not generic UX advice.
- aiBuilderChanges: an array with exactly one entry per finding, in the SAME order as topFindings. Each is a single plain-language, non-technical instruction a founder could paste into an AI website builder (Lovable, v0, Cursor, Claude) to make a first pass at that fix. No UX jargon, no criterion IDs, no dimension names — just what to change, in words anyone understands.

Rules:
- The dimensions array MUST contain all 11 dimensions listed above, each with its exact name and a 0–100 score. Never omit a dimension; if a dimension can't be fully evaluated from the evidence, score it conservatively rather than dropping it.
- You MUST return exactly 5 findings in topFindings, and exactly 5 entries in aiBuilderChanges (aligned by order). Never return fewer. If the page is strong, include lower-severity refinements and quick wins to reach five — but always deliver five.
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

  // Structured output can still satisfy the schema with an empty findings array.
  // Generate once; if it comes back with fewer than five findings, retry once and
  // keep the better result. A single pass runs well under the 300s serverless
  // ceiling; the retry is the rare-case backstop, not the common path.
  let result = await generate(client, content);
  if (result.topFindings.length < 5) {
    console.warn(
      `[scorecard] first pass returned ${result.topFindings.length} findings — retrying`,
    );
    const retry = await generate(client, content);
    if (retry.topFindings.length > result.topFindings.length) result = retry;
  }
  // Keep at most five findings and align the AI-builder change list to them.
  const topFindings = result.topFindings.slice(0, 5);
  return {
    ...result,
    topFindings,
    aiBuilderChanges: result.aiBuilderChanges.slice(0, topFindings.length),
  };
}

async function generate(
  client: Anthropic,
  content: Anthropic.ContentBlockParam[],
): Promise<ScorecardResult> {
  // Adaptive thinking spends from the same max_tokens budget as the output, so
  // give the structured result generous headroom — at 16k the thinking pass
  // starved the JSON and it came back truncated (a few dimensions, empty
  // findings). Stream the request: above ~16k max_tokens a non-streaming call
  // risks an SDK HTTP timeout. "medium" effort keeps a single pass sharp while
  // staying under the serverless ceiling.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 48_000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: scorecardJsonSchema } },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  } as unknown as Anthropic.MessageStreamParams);
  const response = await stream.finalMessage();

  if (response.stop_reason === "max_tokens") {
    console.warn("[scorecard] hit max_tokens — output may be truncated");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text output for the scorecard");
  }
  return scorecardResultSchema.parse(JSON.parse(textBlock.text));
}
