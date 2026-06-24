// Single source of truth for analytics IDs (React / Next.js side).
// The static-report injector (scripts/inject-analytics.mjs) reads the same
// env vars independently so the landing page and the reports stay in sync.
//
// Set these in .env.local for local dev and in Vercel → Project →
// Environment Variables for Preview + Production. When unset, the analytics
// scripts simply do not render (keeps local/dev builds clean).

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "";
