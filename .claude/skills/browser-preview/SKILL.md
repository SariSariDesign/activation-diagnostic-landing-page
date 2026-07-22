---
name: browser-preview
description: Use when previewing, running, or visually iterating on the activation-diagnostic landing page in a browser — launches the Next.js dev server with the Agentation annotation toolbar and the Dial Kit tuning panels loaded so the user can click UI elements to give feedback and tune motion/layout live.
---

# Browser Preview (Agentation + Dial Kit)

## Overview

This project has two dev-only, browser-based feedback tools that auto-load in
development. Use this loop to iterate visually with the user instead of guessing
from screenshots:

- **Agentation** — click any element on the page, add a note, copy structured
  markdown (CSS selector, element path, computed styles). The user pastes it
  back so you know the exact element and change requested.
- **Dial Kit** — bespoke dev panels for live-tuning hero motion, testimonial
  layout, and the logo crawl. Values can be "baked" into the defaults once tuned.

Both appear as a **toolbar row in the bottom-right** (Dial pill on the left,
Agentation circle on the right). They render in `next dev` only and are excluded
from production builds — never ship them.

## Quick start

```bash
npm run dev            # Next.js dev server → http://localhost:3000
```

Open **http://localhost:3000**. In dev, both toolbars load automatically. Tell
the user to click the Agentation toolbar, annotate, and paste the output here.

To confirm a change works, drive the real page (see the `run`/`verify` skills).
A quick headless screenshot loop: `npx playwright screenshot --viewport-size=390,900 --wait-for-timeout=6000 http://localhost:3000 out.png` (use 390px to check mobile, 1280px for desktop).

## Where each Dial Kit panel lives

| Panel | Route | Tunes |
|-------|-------|-------|
| Hero motion | `/` | typewriter/reveal timing, caret |
| Testimonials | `/playground/testimonials` | speech-bubble size, carousel, reveal |
| Logo crawl | `/playground/logos` | speed, gap, fade edges |

Dial panels show in dev **or** on any route via `?dials=1` (e.g. a production
preview URL). Agentation shows in dev only.

## How it's wired (so you can re-establish it if missing)

- **Agentation**: `agentation` devDependency → `src/components/dev/AgentationDev.tsx`
  (a `"use client"` wrapper) → mounted in `src/app/layout.tsx` behind a
  dead-branch `dynamic()` import guarded by `process.env.NODE_ENV === "development"`.
  The dead branch is what keeps it out of the production bundle.
- **Dial Kit**: `src/components/dials/DialControls.tsx` (shared primitives +
  `panelWrap`) plus `*WithDials.tsx` wrappers per section. `AGENTATION_CLEARANCE`
  in `DialControls.tsx` offsets the panel left so it doesn't stack on Agentation.

## Verify production safety after touching layout/dev tooling

```bash
npm run build
grep -rl "agentation" .next/static   # must print NOTHING (excluded from prod)
```

If `grep` finds a match, the dev-only guard regressed — the widget would ship to
real visitors. Re-check the `dynamic()` dead-branch in `layout.tsx`.

## Common mistakes

- **Starting a second `npm run dev`** while one is running → port 3000 conflict.
  Reuse the running server or kill it first (`pkill -f "next dev"`).
- **Annotating a headless full-page screenshot and finding sections blank** —
  scroll-triggered reveals (testimonials, logos) stay at `opacity:0` until in
  view; a non-scrolling capture won't show them. Use the `/playground/*` routes,
  which play immediately, or scroll before capturing.
- **Adding a dev widget with a plain top-level `import`** → it ships to prod even
  if never rendered. Always use the dead-branch `dynamic()` pattern above.
