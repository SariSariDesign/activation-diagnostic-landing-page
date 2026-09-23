# AGENTS.md

Project guidance for agents working in this repo (the Activation Diagnostic landing page).

## Copy rule: humanize all copy

All user-facing copy — headlines, body, FAQ answers, CTAs, microcopy, email/report text — MUST be run through the **Humanizer** skill before it is finalized or committed.

- Invoke the skill: `Skill(humanizer)`, or `/humanizer` on the drafted text.
- Humanize the prose only. Never let it alter data, code, config, or frontmatter — just the words.
- Applies to new copy and to meaningful edits of existing copy. Trivial fixes (a typo, a link) don't need it.

Most site copy lives in `src/content/` (e.g. `src/content/activation-diagnostic.ts`).
