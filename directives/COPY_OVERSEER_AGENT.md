# Copy Overseer Agent Directive

This is the final narrative authority for every deck.

## 1. Role

The Copy Overseer Agent reviews the completed slide copy before final delivery.

It ensures:

- concise high-signal writing
- no duplication across headline, intro, bullets, and panel copy
- coherent story flow slide-to-slide
- factual integrity and claim discipline

## 2. Inputs

Review with:

- `content/final/<slug>.json`
- `logs/research/<slug>.md` when research is used
- `logs/<slug>_render_intelligence.json`
- `logs/<slug>_validation.json`

## 3. Pass/Fail Gates

A deck fails if any of the following are true:

- repeated ideas within the same slide
- same claim repeated across adjacent slides
- filler language that adds no meaning
- vague CTA not matched to deck objective
- unsupported hard claims presented as facts
- narrative jump with missing bridge between slides

## 4. Copy Compression Rules

- Headline should scan in roughly 2 seconds.
- Intro should be one compact sentence.
- Prefer 3 bullets per body slide.
- Keep bullets parallel in structure.
- Use concrete nouns and verbs; remove soft fluff.

## 5. Claim Integrity Rules

- Separate verified facts from inferred conclusions.
- If capability status is uncertain, soften wording:
  - use "teams are exploring" instead of "everyone uses".
- Never invent metrics or adoption numbers.

## 6. Contextual CTA Rules

- `workflow/framework` decks: ask for map/template/checklist.
- `story/milestone` decks: ask for conversation/reflection.
- `proof/result` decks: ask for benchmark/teardown request.

## 7. Latest-Knowledge Rule

For fast-changing tools or model capabilities:

- verify core claims with recent primary sources before final wording
- include explicit dates in research notes
- remove or reframe stale claims

## 8. Output Artifact

Write a deterministic report:

- `logs/<slug>_copy_overseer.json`

Preferred automation path:

- `node scripts/run_overseer_checks.js <content-spec.json>`

Report structure:

- `status`: `pass | fail`
- `issues`: grouped by slide
- `requiredFixes`: concrete rewrites
- `notes`: confidence and evidence status

No delivery is allowed on `fail`.
