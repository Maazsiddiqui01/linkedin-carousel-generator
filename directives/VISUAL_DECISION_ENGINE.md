# Visual Decision Engine Directive

Use this directive to deterministically choose intent, top chip, and right-panel visual mode for each slide.

## 1. Intent Resolution

Resolve intent in this order:

1. Explicit `slide.intent`
2. Legacy workflow hint (`slide.stepNumber` or `Workflow N` headline)
3. Heuristic inference from headline + intro + bullets

Allowed intents:

- `workflow`
- `result`
- `milestone`
- `proof`
- `context`
- `framework`
- `transition`
- `story`
- `custom`

## 2. Top Chip Rules

Body slides may show one top chip only.

Chip mode resolution:

1. `chip.mode=hide` -> do not render chip
2. `chip.mode=workflow` -> render only if intent is `workflow`
3. `chip.mode=label` -> use explicit `chip.label` (controlled set unless intent is `custom`)
4. `chip.mode=auto` -> use intent mapping if confidence >= 0.65, else hide

Controlled chip labels:

- `Workflow`
- `Result`
- `Milestone`
- `Proof`
- `Context`
- `Framework`
- `Next Move`
- `Story`

Intent to label map:

- `workflow` -> `Workflow {n}`
- `result` -> `Result`
- `milestone` -> `Milestone`
- `proof` -> `Proof`
- `context` -> `Context`
- `framework` -> `Framework`
- `transition` -> `Next Move`
- `story` -> `Story`
- `custom` -> requires explicit label

## 3. Visual Mode Selection

Body slide visual mode must be one of:

- `none`
- `kpi`
- `cards`
- `chart`
- `image`
- `auto`

Selection order for `auto`:

1. Explicit chart data + available chart asset
2. Image asset (explicit or generated)
3. Explicit KPI stats
4. Auto KPI extraction from strong numeric signal
5. Explicit cards
6. Auto conceptual cards with relevance + anti-dup pass
7. `none`

## 4. Relevance and Anti-Dup Gates

Cards must be rejected if:

- Card title/detail duplicates primary bullet meaning
- Card relevance to slide context is below threshold
- Card text is generic filler unrelated to context

If no valid cards remain, do not backfill with generic placeholders.

## 5. Blocking Fail Conditions

Validation must fail when:

- Workflow chip is used on non-workflow intent
- `chip.mode=label` has missing/invalid label (unless intent is `custom`)
- `visual.mode=chart` has invalid chart data
- Explicit visual cards duplicate bullet narrative

## 6. Logging

Renderer must output `logs/<slug>_render_intelligence.json` with per-slide:

- resolved intent + confidence + source
- chip decision + confidence + hidden reason
- visual mode + source + confidence
- rejected visual/chip candidates and reasons

## 7. Density Profile

Body slides should resolve to a density profile:

- `compact`: tighten vertical spacing when copy is short
- `balanced`: default mode
- `airy`: expand spacing when copy load is heavy

Use explicit `slide.densityProfile` or `planner.densityProfile` when set; otherwise infer automatically from text and panel load.
