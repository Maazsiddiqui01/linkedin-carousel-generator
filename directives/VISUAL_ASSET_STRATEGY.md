# Visual Asset Strategy Directive

Use this directive to select and produce the right visual medium per slide: chart, infographic, illustration, or image.

## 1. Goal

Every deck should feel intentionally art-directed, with visuals that carry meaning and reduce text load.

Design benchmark:

- aesthetic quality must be comparable to premium manual slide design
- visual choices must prioritize comprehension before decoration

## 2. Mode Selection Matrix

Choose one primary side-panel mode per body slide:

1. `chart`
   - Use when explicit series data exists in `slide.visual.chart`.
2. `kpi`
   - Use when numeric anchors are present but not trend-series data.
3. `cards`
   - Use when conceptual breakdown is needed and metrics are weak.
4. `image`
   - Use when a visual metaphor or scene explains faster than text.
5. `none`
   - Use only when no relevant visual signal exists.

Never stack unrelated modes in the same panel.

Coverage target:

- Meet at least 30% body-slide visual coverage by default.
- If `planner.visualCoverageTarget` exists, use that value.

## 3. Chart Rules

- Chart data must be explicit and real.
- Allowed chart types: `bar`, `line`, `doughnut`.
- Use concise labels and clean axis formatting.
- No decorative chart junk (3D effects, noisy gradients, dense legends).

## 4. KPI Card Rules

- Promote only meaningful values.
- Keep labels outcome-oriented and short.
- KPI-only panels are valid; do not add filler cards just to fill space.

## 5. Insight Card Rules

- Use only when cards add net-new signal.
- Reject cards that duplicate bullet narrative.
- Keep titles short and conceptual.

## 6. Illustration/Image Rules

- Prefer clean editorial-style visuals.
- No embedded text overlays.
- One focal concept per image.
- Match palette to deck accent colors.
- Avoid clutter and generic stock look.

## 7. Asset Generation Pipeline

Supported scripts:

- `scripts/generate_imagen_assets.js`
  - Prompt packs and optional generated images.
- `scripts/generate_chart_assets.js`
  - Deterministic chart image generation from explicit chart data.

Preferred behavior:

- use image generation for slides where a metaphor communicates faster than extra bullets
- use chart generation only with explicit values (never inferred from prose)

Expected outputs:

- `output/generated_images/<slug>/...`
- `output/generated_charts/<slug>/...`

## 8. Aesthetic and Alignment Quality

- Keep panel proportions consistent across similar slides.
- Preserve stable spacing between headline, intro, bullets, and panel.
- Reduce perceived whitespace by balancing text density with visual density.
- Do not let decorative elements compete with message clarity.

## 9. Fail Conditions

Treat as quality failure:

- irrelevant chip/label for slide intent
- panel text repeating primary bullets
- generic fallback cards that do not match slide context
- chart mode without valid data

## 10. Alignment and Consistency Rule

- Similar slide types should maintain consistent panel proportions and vertical alignment.
- Do not mix dense text with tiny visuals; rebalance by reducing text first.
- If panel content is low-value, hide it and tighten the text block rather than forcing filler.
