# Infographic Pattern Library

Use this library to convert content into structured visual components.
Only use patterns that fit the actual content. Do not force a pattern that weakens clarity.

## 1. Selection Rules

Choose patterns using this order:

1. Explicit chart data present -> chart pattern
2. Numeric signal present -> KPI-focused pattern
3. Sequential process present -> process/timeline pattern
4. Comparison language present -> comparison pattern
5. Category grouping present -> matrix/quadrant pattern
6. No strong structure -> insight cards as fallback

## 2. Approved Patterns

### A. KPI Stat Cards

Use when:

- Slide contains numeric anchors (money, percentages, counts, years, time saved)

Structure:

- 2 to 4 cards
- Each card has:
  - `value` (short)
  - `label` (clear meaning)

Rules:

- Promote only real values from source text.
- Keep labels short and outcome-oriented.

### B. Insight Cards

Use when:

- No strong numeric data but multiple actionable bullets exist

Structure:

- 2 to 4 compact cards
- Each card has:
  - icon
  - short title
  - supporting detail

Rules:

- Title should be 2 to 5 words.
- Detail should be one concise line.

### C. Process Nodes

Use when:

- Content describes flow, steps, or lifecycle

Structure:

- Center node + 3 to 6 connected labels
or
- Horizontal step chain (Step 1 -> Step N)

Rules:

- Node labels should be nouns or short verb phrases.
- Keep sequence obvious.

### D. Timeline Strip

Use when:

- Content is chronological (past -> present -> next)

Structure:

- 3 to 5 time points with label and short descriptor

Rules:

- Emphasize transition and progression.
- Keep each point under 8 words where possible.

### E. Comparison Grid

Use when:

- There is explicit contrast (before/after, option A/B, manual/automated)

Structure:

- 2-column grid
- Row labels for criteria
- Optional highlight row for recommendation

Rules:

- Keep criteria parallel.
- Use neutral phrasing, no hype claims.

### F. Matrix / Quadrant

Use when:

- Content naturally maps to 2 dimensions (impact/effort, short/long term)

Structure:

- 2x2 grid
- 1 to 2 items per quadrant max

Rules:

- Axis titles must be explicit.
- Avoid overcrowding.

### G. Chart Panel

Use when:

- Slide includes explicit chart-ready numeric series in `visual.chart`.

Structure:

- One chart per slide panel (`bar`, `line`, or `doughnut`)
- Optional short chart footnote

Rules:

- Use explicit data only; do not infer values from prose.
- Keep chart labels concise and legible.
- Avoid mixing charts with extra insight-card clutter in the same side panel.
- Prefer deterministic chart assets from `scripts/generate_chart_assets.js`.
- Keep visual density balanced so chart occupies meaningful space (not tiny thumbnail scale).

## 3. Slide Mapping Guidance

- Framing slides:
  - Prefer process nodes or compact category diagram
- Body slides with explicit trend/comparison series:
  - Prefer a chart panel
- Body slides with numbers:
  - Prefer KPI stat cards (KPI-only panel is valid)
- Body slides with method explanation:
  - Prefer process nodes or comparison grid
- CTA slides:
  - Usually no heavy infographic needed

## 4. Data Integrity Rules

- Never invent metrics.
- Never imply causality unless present in source.
- If value is ambiguous, keep it in narrative text instead of KPI card.

## 5. Density and Balance

- For square slides, keep infographic block to about 30 to 45 percent width in two-column layouts.
- Do not compress text below readability thresholds to fit more visuals.
- If infographic crowding occurs, reduce items rather than reducing legibility.
- Keep side panel mode exclusive per slide:
  - choose one of KPI, cards, chart, or image

## 6. Deterministic Schema Fields (Implemented)

Use these slide-level fields for deterministic control:

- `visual.mode`: `none | kpi | cards | chart | image | auto`
- `visual.stats`: list of `{ value, label }`
- `visual.cards`: list of `{ icon, title, detail }`
- `visual.chart`: `{ type, title, series, footnote? }`
- `visual.imagePath`: explicit image asset path

When these fields evolve:

- Update `schemas/carousel.schema.json`
- Update renderer template and validation rules
- Add a regression content spec under `content/tests/`
