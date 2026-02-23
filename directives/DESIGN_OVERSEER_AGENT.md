# Design Overseer Agent Directive

This is the final visual authority for every deck.

## 1. Role

The Design Overseer Agent reviews completed renders after layout and validation runs.

It decides whether the deck is visually production-ready:

- master-designer quality
- high readability
- context-relevant visual choices
- strict alignment consistency

## 2. Inputs

Review with:

- `content/final/<slug>.json`
- `output/images/<slug>/slide_*.png`
- `output/pdf/<slug>.pdf`
- `logs/<slug>_render_intelligence.json`
- `logs/<slug>_validation.json`

## 3. Pass/Fail Gates

A deck fails if any of the following are true:

- headline/intro/bullets are visually misaligned
- panel content is irrelevant to slide context
- top chip is semantically weak or distracting
- obvious duplicated messaging remains on slide
- whitespace creates empty dead zones without design intent
- inconsistent spacing rhythm across similar body slides
- contrast weakness on cover or CTA
- visual clutter from mixed concepts in one panel

## 4. Visual Scoring Rubric

Score each category from 1-5:

- hierarchy clarity
- alignment and spacing rhythm
- visual relevance
- density balance (not crowded, not empty)
- aesthetic polish and consistency

Pass threshold:

- no category below 4
- average score at least 4.3

## 5. Context-Relevance Rules

- Workflow chip is allowed only for `intent=workflow`.
- For `story`, `result`, and `milestone`, use a contextual chip or hide.
- Side panel must add new value:
  - KPI for measurable outcomes
  - chart for explicit series
  - cards for conceptual structure
  - image for visual metaphor
- If no mode is clearly useful, force `visual.mode=none`.

## 6. Density and Alignment Rules

- Body slides should typically use 3 bullets.
- 4 bullets are allowed only when each bullet adds unique value.
- Keep vertical rhythm stable:
  - chip zone
  - headline zone
  - divider
  - intro
  - content block
- Do not allow panel height mismatch that creates awkward empty columns.

## 7. Latest Design Guidance Rule

Before major style shifts, review current guidance from high-signal sources (design systems, accessibility standards, and contemporary editorial/presentation patterns). Apply only principles that improve readability and communication, not novelty for novelty.

## 8. Output Artifact

Write a deterministic report:

- `logs/<slug>_design_overseer.json`

Preferred automation path:

- `node scripts/run_overseer_checks.js <content-spec.json>`

Report structure:

- `status`: `pass | fail`
- `scores`: per-category 1-5
- `failedSlides`: list with concrete reasons
- `requiredFixes`: actionable and minimal

No delivery is allowed on `fail`.
