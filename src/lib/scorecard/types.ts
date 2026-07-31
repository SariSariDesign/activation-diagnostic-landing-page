import { z } from "zod";

/**
 * Shape of a generated Activation Scorecard preview. Produced by the analysis
 * engine (src/lib/scorecard/analyze.ts) and consumed by the email renderer and
 * the on-site <Scorecard> component. Mirrors the ux-audit skill's model: an
 * overall score, per-dimension scores across 11 UX dimensions, and a top-5
 * friction list.
 */

export const SEVERITIES = ["critical", "major", "minor"] as const;
export const RATINGS = ["high", "medium", "low"] as const;

/** The 11 core UX dimensions from the ux-audit rubric. */
export const DIMENSIONS = [
  "Nielsen's Heuristics",
  "Conversion Rate Optimization",
  "Information Architecture",
  "Interaction Design",
  "Visual & Brand Design",
  "Content & Copywriting",
  "Accessibility",
  "Performance",
  "SEO & Discoverability",
  "Mobile UX",
  "QA / Bugs",
] as const;

export const dimensionScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().int().min(0).max(100),
});

export const findingSchema = z.object({
  title: z.string(),
  page: z.string(),
  description: z.string(),
  severity: z.enum(SEVERITIES),
  effort: z.enum(RATINGS),
  impact: z.enum(RATINGS),
  recommendation: z.string(),
});

export const scorecardResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  headline: z.string(),
  summary: z.string(),
  dimensions: z.array(dimensionScoreSchema),
  topFindings: z.array(findingSchema),
});

export type DimensionScore = z.infer<typeof dimensionScoreSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type ScorecardResult = z.infer<typeof scorecardResultSchema>;

/**
 * JSON Schema passed to Claude via `output_config.format` to constrain the
 * response. Kept in sync with `scorecardResultSchema` above. Structured-outputs
 * requires `additionalProperties: false` and every property listed in `required`.
 */
export const scorecardJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "integer", description: "Overall activation score, 0–100." },
    headline: {
      type: "string",
      description: "One-line verdict on the page's activation readiness.",
    },
    summary: {
      type: "string",
      description: "2–3 sentence plain-language summary of the biggest opportunities.",
    },
    dimensions: {
      type: "array",
      description: "Per-dimension scores across the 11 UX dimensions.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dimension: { type: "string", enum: [...DIMENSIONS] },
          score: { type: "integer", description: "0–100 score for this dimension." },
        },
        required: ["dimension", "score"],
      },
    },
    topFindings: {
      type: "array",
      description: "The top 5 points of friction, ordered most-to-least impactful.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Short, specific finding title." },
          page: { type: "string", description: "Where on the page/site this occurs." },
          description: {
            type: "string",
            description: "2–3 sentences on what was observed and why it hurts conversion.",
          },
          severity: { type: "string", enum: [...SEVERITIES] },
          effort: { type: "string", enum: [...RATINGS] },
          impact: { type: "string", enum: [...RATINGS] },
          recommendation: {
            type: "string",
            description: "Specific, standalone action item to fix it.",
          },
        },
        required: [
          "title",
          "page",
          "description",
          "severity",
          "effort",
          "impact",
          "recommendation",
        ],
      },
    },
  },
  required: ["overallScore", "headline", "summary", "dimensions", "topFindings"],
} as const;

/** Sample result used for the modal's illustrative preview and for local UI dev. */
export const SAMPLE_SCORECARD: ScorecardResult = {
  overallScore: 79,
  headline: "Strong foundation, five fixable leaks before the a-ha moment",
  summary:
    "Your landing page communicates the core value quickly, but competing calls-to-action and thin proof are diluting intent right before signup. Tightening the path to first value should lift activation meaningfully.",
  dimensions: [
    { dimension: "Nielsen's Heuristics", score: 82 },
    { dimension: "Conversion Rate Optimization", score: 68 },
    { dimension: "Information Architecture", score: 80 },
    { dimension: "Interaction Design", score: 84 },
    { dimension: "Visual & Brand Design", score: 88 },
    { dimension: "Content & Copywriting", score: 72 },
    { dimension: "Accessibility", score: 70 },
    { dimension: "Performance", score: 76 },
    { dimension: "SEO & Discoverability", score: 81 },
    { dimension: "Mobile UX", score: 74 },
    { dimension: "QA / Bugs", score: 90 },
  ],
  topFindings: [
    {
      title: "Competing calls-to-action above the fold",
      page: "Homepage hero",
      description:
        "Five distinct CTAs sit in the first viewport, splitting attention at the exact moment a visitor decides whether to act. The primary action loses visual priority.",
      severity: "critical",
      effort: "low",
      impact: "high",
      recommendation:
        "Reduce the hero to one primary CTA and demote the rest to secondary links lower on the page.",
    },
    {
      title: "Proprietary terms are never defined",
      page: "Homepage / product section",
      description:
        "The page leans on branded terminology without explaining it, forcing visitors to infer meaning and adding cognitive load before they understand the offer.",
      severity: "major",
      effort: "low",
      impact: "medium",
      recommendation:
        "Add a one-line plain-language definition the first time each proprietary term appears.",
    },
    {
      title: "Social proof is buried below the fold",
      page: "Homepage",
      description:
        "Testimonials and logos appear only after several scrolls, so trust signals arrive after the decision point rather than reinforcing it.",
      severity: "major",
      effort: "medium",
      impact: "high",
      recommendation:
        "Surface one strong proof point (a named testimonial or metric) within the first viewport.",
    },
    {
      title: "Signup form asks for too much, too early",
      page: "Signup",
      description:
        "The form requests fields that aren't needed to deliver first value, increasing friction at the highest-drop-off step of the flow.",
      severity: "major",
      effort: "medium",
      impact: "high",
      recommendation:
        "Collect only what's required to reach first value; defer the rest to after activation.",
    },
    {
      title: "No visible path to first value after signup",
      page: "Post-signup",
      description:
        "After creating an account, the next step toward the product's core value isn't obvious, leaving new users on an empty state with no guided action.",
      severity: "minor",
      effort: "high",
      impact: "medium",
      recommendation:
        "Add a single, clear first action (a checklist item or guided step) on the post-signup screen.",
    },
  ],
};
