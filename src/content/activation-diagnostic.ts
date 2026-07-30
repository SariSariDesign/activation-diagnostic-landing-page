/**
 * The Activation Diagnostic: long-form offer landing page copy.
 * Verbatim from 01_Projects/activation-sprint/activation-diagnostic-landing-page-prompt.md.
 * One offer, one CTA, one destination. Do not add secondary links here.
 */

export const ACTIVATION_BOOKING_URL =
  "https://calendly.com/sarisari/sari-sari-activation-sprint-intro-call";

const CTA_LABEL = "Book an intro call";

export const diagnostic = {
  bookingUrl: ACTIVATION_BOOKING_URL,
  ctaLabel: CTA_LABEL,

  meta: {
    title: "The Activation Diagnostic | Sari Sari Design",
    description:
      "A focused 21-day UX activation diagnostic for Seed–Series A founders. One flow, audited, prototyped, and backed by the reasoning behind every decision. Flat $2,500.",
  },

  hero: {
    eyebrow: "For Seed–Series A founders",
    headline: "Eliminate drop-off. Activate more users in 21 days.",
    subhead: [
      "No retainer.",
      "No 8-week timeline.",
      "One high-impact flow that's audited, rebuilt, and proven to work",
    ],
    // Mobile collapses the three subhead lines into one running paragraph so the
    // hero fold stays tight and the phone anchor can sit above the fold.
    subheadParagraph:
      "No retainer, no 8-week timeline, one high-impact flow that's audited, rebuilt, and proven to work.",
    microcopy:
      "30 minutes. We'll tell you honestly whether this is worth your time before you spend a dollar.",
    trust:
      "Built by senior designers, and trusted by Fortune 500 companies and 15+ clients.",
    logosLabel: "Trusted by 20+ global teams",
  },

  problem: {
    index: "01",
    headline:
      "You raised the round. The board wants growth. But signups aren't turning into active users.",
    body: [
      "You shipped fast to get to market. The product works, but the experience around it is rough, and you can feel it in the numbers. People sign up and never come back. They hit the part of the flow where they're supposed to trust you with something personal (their data, their health, an AI recommendation) and they hesitate.",
      "You know design is the problem. What you don't have is a designer who can tell you which part of the flow is leaking, why, and what to do about it, all without a three-month commitment or a senior hire you're not ready to make.",
      "Generic agencies will redesign your screens. They won't understand why a user in a health product needs a different kind of reassurance than a user buying software.",
      "That difference is the whole game.",
    ],
  },

  whatThisIs: {
    index: "02",
    eyebrow: "The solution",
    headline: "The 21 Day Activation Diagnostic",
    aside: {
      label: "One step at a time",
      body: "Each deliverable builds on the one before it, descending from first diagnosis to your 90-day plan.",
    },
    body: [
      "A 21-day engagement focused on a single outcome: find the highest-impact fix in your activation flow and prove it works before you invest another dollar in design.",
      "By focusing on one core part of your flow, we can raise your conversion, retention, or activation to industry benchmarks, so you can focus on landing the next raise and growing your user base.",
      "You walk away with a clear, evidence-backed answer to \u201Cwhat should we fix first, and what will it be worth?\u201D",
    ],
    deliverables: [
      {
        title: "Activation Scorecard",
        body: "A 0–100 Activation Score with a clear band, a rating breakdown across ~11 UX dimensions, a benchmark against the top performers in your vertical, and the top 5 friction areas costing you conversions.",
      },
      {
        title: "Annotated Flow Map",
        body: "A screen-by-screen map of the user journey with every drop-off risk marked, each paired with a specific, data-backed recommendation and prioritized by severity — from trust-breaking blockers to quick wins. Clear enough to forward to a cofounder who'll get it in two minutes.",
      },
      {
        title: "High-Fidelity Prototype",
        body: "Your redesigned critical path in Figma, clickable — 5–8 screens from entry to the moment a user sees value. This is where we earn our keep: senior design judgment and deep product expertise, grounded in your data and driven by the metric each decision is built to move.",
      },
      {
        title: "Decision Rationale",
        body: "For every major design decision, we explain why it matters and which metric it should move. So you're not taking our word for it.",
      },
      {
        title: "Your Next 90 Days",
        body: "A one-page roadmap of what we'd do next, mapped to your activation metrics. Useful whether you work with us again or not.",
      },
    ],
  },

  goal: {
    index: "03",
    eyebrow: "The goal",
    headline:
      "The point isn't prettier screens. It's a flow that earns trust and activates more users.",
    body: [
      "By the end of three weeks, you'll know exactly which part of your activation flow is costing you the most users, you'll have a working prototype of the fix, and you'll understand the reasoning well enough to defend it to your team and your board.",
      "If you have analytics, we'll ground the diagnosis in your data. If you don't yet, our method still works. We lean on behavioral heuristics, competitive benchmarking, and early to growth stage domain expertise. Either way, you stop guessing about what to fix.",
    ],
  },

  howItWorks: {
    index: "04",
    eyebrow: "How it works",
    headline: "21 days, three phases, one flow done right.",
    phases: [
      {
        tag: "Phase 1 · Diagnose",
        week: "Week 1",
        body: "A 60 minute discovery call to get product and analytics access and align on the flow. Then we walk your product as a new user, pull behavioral data where it exists, and benchmark you against the top performers in your vertical. You get the activation scorecard and flow map for review.",
      },
      {
        tag: "Phase 2 · Design",
        week: "Week 2",
        body: "We design one direction for the critical path, not ten options to choose between. Speed and conviction over breadth. Mid-week, a short check-in so we catch any misalignment early. You get the prototype and the rationale.",
      },
      {
        tag: "Phase 3 · Deliver",
        week: "Week 3",
        body: "One round of feedback, incorporated. Then a 45-minute results call: we walk you through the diagnosis, click through the prototype, and hand you the 90-day roadmap.",
      },
    ],
    callout:
      "Clock starts when access does. We can't audit a product we can't get into, so the 21 days begin once you've given us product access, analytics access (if you have it), and a point of contact.",
  },

  forYou: {
    index: "05",
    headline: "This is built for you if…",
    items: [
      "You're a Seed–Series A startup that raised in the last 18 months and feels the pressure to show activation, not just signups.",
      "You're a technical, clinical, or operator founder (not a designer), and you need someone who can tell you what \u201Cgreat\u201D looks like.",
      "Your product is live and has real users moving through a real flow.",
      "Your users make decisions that require trust: sharing health data, following a protocol, acting on an AI recommendation.",
      "You want proof a partner is worth it before committing to a retainer or a design hire.",
    ],
  },

  notForYou: {
    headline: "This isn't the right fit if…",
    items: [
      "You're pre-launch with no users in the flow yet. We diagnose real behavior; come back when there's something to audit.",
      "You want production-ready code or developer handoff. This is diagnosis and a prototype, not a build.",
      "You need ten directions to choose from. We make one strong, defensible call and show our work.",
      "You're looking for the cheapest screens you can get. This is senior level product design and strategy work priced like it.",
      "You need FDA regulatory submission or SaMD authoring. That's outside what we do (though we're strong on designing for already-cleared products).",
    ],
  },

  comparison: {
    index: "06",
    eyebrow: "Why this over a bigger engagement",
    headline: "Why not just hire an agency or sign a retainer?",
    intro:
      "You shouldn't commit three months and tens of thousands of dollars to a design partner you've never worked with. The Activation Diagnostic is designed to be the low-risk way to find out if we're right for each other.",
    columns: ["The Activation Diagnostic", "A full retainer / agency"],
    rows: [
      {
        criterion: "Commitment",
        diagnostic: "21 days, one flow",
        agency: "3+ months, ongoing",
      },
      {
        criterion: "Risk",
        diagnostic: "Fixed scope, fixed price",
        agency: "Open-ended spend",
      },
      {
        criterion: "Speed to value",
        diagnostic: "Working prototype in three weeks",
        agency: "Often 8+ weeks to first deliverable",
      },
      {
        criterion: "Decision needed",
        diagnostic: "A founder's call",
        agency: "Cofounder / board sign-off",
      },
      {
        criterion: "What you prove",
        diagnostic: "Whether the partnership works",
        agency: "You find out after you've committed",
      },
    ],
    outro:
      "When the three weeks are done, you'll know exactly how we think and what our work is worth. If a retainer makes sense, the roadmap is already written. If it doesn't, you keep a diagnosis and a prototype you can act on. Either way, you're ahead.",
  },

  price: {
    index: "07",
    eyebrow: "Price & scope",
    headline: "One flow. Three weeks. $2,500.",
    body: "A flat fee, no tiers, no surprises. That's less than what a week of guessing costs a growth-stage startup. If your activation rate is 15% when it could be 30%, that gap is worth far more than the price of finding the fix. We're not selling hours of design work. We're selling the diagnosis and the proof that could unlock the revenue you're already leaving on the table.",
    included: [
      "One user flow, chosen by us for highest activation impact",
      "All five deliverables (activation scorecard, flow map, prototype, rationale, 90-day roadmap)",
      "Kickoff call, mid-engagement check-in, and a 45-minute results call",
      "One round of revisions on the prototype",
    ],
    excluded: [
      "Additional flows or pages (a separate engagement or part of a retainer)",
      "Production-ready code or engineering handoff",
      "FDA regulatory submission or SaMD authoring",
      "More than one revision round",
    ],
    microcopy: "We'll confirm the flow and kick off on the call.",
  },

  faq: {
    index: "08",
    eyebrow: "FAQ",
    headline: "Questions, answered.",
    items: [
      {
        label: "How fast can we start?",
        body: "The 21-day clock starts the moment you give us product and analytics access and a point of contact. Most engagements kick off within a week of the intro call.",
      },
      {
        label: "We don't have great analytics. Does this still work?",
        body: "Yes. Our method works with or without data. Without it, we rely on behavioral heuristics, competitive benchmarking, and health-vertical expertise. Setting up proper activation analytics is usually one of the first things on your 90-day roadmap.",
      },
      {
        label: "Who actually does the work?",
        body: "A senior designer, the same person on your kickoff and results calls. You're not handed off to a junior team after the sale.",
      },
      {
        label: "Do you write code or hand off to our engineers?",
        body: "No. You get a clickable Figma prototype and the rationale behind it, designed so your engineers can build from it. We don't ship production code in this engagement.",
      },
      {
        label: "What if we want you to look at more than one flow?",
        body: "The Diagnostic is deliberately one flow, and that focus is why it's fast and high-impact. Additional flows are a separate engagement or part of a retainer. We'll talk through what makes sense on the call.",
      },
      {
        label: "We handle sensitive data. Can you work within that?",
        body: "Yes. We design for high-trust, compliance-sensitive health products as our specialty, including HIPAA-covered and FDA-cleared-adjacent products. We don't do regulatory submissions, but designing the experience around them is exactly our lane.",
      },
      {
        label: "How many rounds of revision are included?",
        body: "One round on the prototype, scoped in the agreement, plus a mid-engagement check-in so we catch misalignment early. With a thorough diagnosis up front, feedback tends to be directional, not \u201Cstart over.\u201D",
      },
      {
        label: "What happens after the three weeks?",
        body: "You own everything we deliver. If you want to keep going, your 90-day roadmap is the starting point for a retainer. If not, you've got a diagnosis and a prototype you can run with on your own.",
      },
    ],
  },

  proof: {
    index: "09",
    eyebrow: "Proof",
    headline: "Why founders trust us with this",
    body: "Sari Sari is a product design studio built for early stage companies where trust isn't a nice-to-have. It's the product.\n\nWe spent years designing high-trust, compliance-heavy flows with experience spanning consumer products at startups and Fortune 500 companies like Meta and Disney.",
    // [TO ADD — social proof] Real outcomes/testimonials/logos only. Never fabricate.
    placeholderNote: "Client results coming soon",
    // Real client testimonials only. Never fabricate — add entries as they come in.
    testimonials: [
      {
        quote:
          "The five findings are spot on, and the usability session data makes them hard to argue with. The competing CTAs, the undefined proprietary terms, and the buried proof are all things I knew felt off but couldn't articulate this clearly.\n\nHighly recommend giving your process a shot; you have nothing to lose.",
        name: "Michael Campbell",
        role: "CEO",
        company: "Signal Verified",
        image: "/testimonials/michael-campbell.png",
      },
    ],
  },

  team: {
    index: "10",
    eyebrow: "The team",
    headline: "Meet the team",
    members: [
      {
        name: "Zach Chaco",
        role: "CEO",
        credential: "Producer, Ex-Meta and Disney",
        image: "/team/zach-chaco.jpg",
      },
      {
        name: "Patricia Capiral",
        role: "Chief Creative Officer",
        credential: "15+ years of Design Expertise",
        image: "/team/patricia-capiral.jpg",
      },
    ],
    link: {
      label: "More about us",
      href: "https://www.sarisari.design",
    },
  },

  finalCta: {
    headline: "Find out what your activation flow is really costing you.",
    body: "Book a 30-minute discovery call. We'll look at your product, tell you honestly whether the Activation Diagnostic is the right fit, and if it's not, point you toward what is. No pitch deck, no pressure.",
  },

  /**
   * Free lead-magnet modal ("Try it for free"). This is the deliberate exception
   * to the one-CTA rule above: a secondary, no-cost entry point that captures a
   * lead and emails back a personalized Activation Scorecard preview.
   */
  scorecard: {
    tryItLabel: "Try it for free",
    modalTitle: "Get your free Activation Scorecard preview",
    sampleScore: 79,
    headline: "The top 5 points keeping your users from converting",
    body: [
      "This free tool identifies the top 5 points of friction on your landing page that keep users from converting — the friction standing between them and the “a-ha” moment in your product. Remove it, and more users reach the moment your product proves its worth.",
      "The score is backed by the latest UX research across 11 dimensions — the same techniques we use to help growth-stage companies convert, activate, and retain more users.",
      "Fill out the form and we'll email your personalized Activation Scorecard within minutes. Free.",
    ],
    form: {
      submitLabel: "Get your free Activation Scorecard",
      fields: {
        name: "Name",
        company: "Company",
        email: "Work email",
        stage: "Funding stage",
        url: "Company website, landing page, or product page",
      },
      urlPlaceholder: "https://",
      stageOptions: [
        "Pre-seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C+",
        "Bootstrapped / Other",
      ],
    },
    confirmation: {
      headline: "Your scorecard is on its way.",
      body: "We're analyzing your page now. Check your inbox in a few minutes for your personalized Activation Scorecard — the top 5 points of friction keeping users from converting, and how to fix them.",
      bookPrompt: "Want to talk it through sooner?",
    },
    duplicate: {
      headline: "You've already got one on the way.",
      body: "We've already sent an Activation Scorecard to this email. Check your inbox (and spam) — or book a call and we'll walk through it together.",
      bookPrompt: "Rather talk it through?",
    },
    error: {
      headline: "Something went wrong.",
      body: "We couldn't submit your request just now. Please try again — if it keeps happening, email us and we'll sort it out.",
      retryLabel: "Try again",
    },
    legal: {
      entity: "Sari Sari Design LLC",
      privacyHref: "/privacy",
      termsHref: "/terms",
      note: "By submitting, you agree to our",
    },
  },
} as const;
