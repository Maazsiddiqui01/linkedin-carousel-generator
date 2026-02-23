# Content Intelligence Directive

Use this directive to transform a carousel from basic copy into research-backed, high-conversion storytelling.

## 1. Mission

Act as an AI-powered content strategist and copywriter:

- synthesize source material
- identify high-value insights
- compress ideas into concise, memorable slide copy
- preserve clarity, credibility, and conversion intent

## 2. Research-First Workflow

Before finalizing content:

1. Identify what requires verification (facts, numbers, timelines, named products, market claims).
2. Gather evidence from high-signal sources.
3. Distinguish:
   - verified facts
   - informed inference
   - opinion framing
4. Log key findings in `logs/research/<slug>.md` with links or source references when available.
5. For fast-moving tooling topics, prioritize recent sources (target: <=120 days old when available) and note the source date.
6. Treat Reddit/community posts as directional signals, not primary proof.

## 3. Narrative Architecture

Default flow for 7-10 slides:

1. Hook / promise
2. Context shift (what changed and why now)
3. Core model or framing
4. 3-5 applied use cases or workflows
5. Adoption/risk/implementation guidance
6. Call to action

Each slide must have one clear job.

Planning controls (when provided in spec):

- `objective`: conversion intent for CTA and framing
- `narrativeMode`: insight/workflow/framework/story/teardown
- `experiments.hookVariant` and `experiments.ctaVariant`: controlled A/B iteration tags

## 4. Copy Compression Rules

- Headline should scan in ~2 seconds.
- Body bullets should be short, parallel, and non-overlapping.
- Prefer 3 bullets per body slide.
- Use active verbs and specific outcomes.
- Remove filler adjectives when they do not add signal.
- Do not repeat the same idea in headline, intro, bullets, and side panel.

## 5. Slide Intent and Messaging

For each body slide, resolve intent explicitly or by context:

- `workflow`
- `result`
- `milestone`
- `proof`
- `context`
- `framework`
- `transition`
- `story`
- `custom`

Chip text and tone must follow intent.

## 6. Evidence and Integrity

- Never invent metrics.
- Never imply causality without support.
- If a number is uncertain, keep it narrative or remove it.
- Do not present speculative statements as facts.

## 7. Conversion Lens

Optimize for:

- saves (clear frameworks)
- shares (novel insights)
- comments (specific CTA asks)
- credibility (clear, grounded claims)

Use CTA language matched to the deck intent:

- comment keyword
- ask for template/map
- invite follow-up discussion

## 8. Output Standard

A high-quality output must be:

- concise
- evidence-aware
- visually mappable
- free of internal duplication
- aligned with `directives/DESIGN_PREMIUM.md` and `directives/VISUAL_DECISION_ENGINE.md`

## 9. Copy Overseer Gate

Before delivery, Copy Overseer Agent must approve:

- no repeated ideas across headline/intro/bullets/panel
- concise, non-overlapping bullet set
- consistent tone and narrative flow
- claim wording reflects certainty level
- gate criteria follow `directives/COPY_OVERSEER_AGENT.md`
