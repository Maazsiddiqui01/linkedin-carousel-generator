# Production Design Directive (Premium Slides)

This directive is mandatory for all carousel generations. Use it with:

- `directives/GEMINI.md`
- `directives/SUB_AGENT_ORCHESTRATION.md`
- `directives/DESIGN_OVERSEER_AGENT.md`
- `directives/COPY_OVERSEER_AGENT.md`
- `directives/VISUAL_DECISION_ENGINE.md`
- `directives/VISUAL_ASSET_STRATEGY.md`
- `directives/INFOGRAPHIC_LIBRARY.md`

## 1. Goal

Produce slides that look like polished, production-ready assets built by a master-level designer, not auto-generated text pages.

## 2. Non-Negotiable Outcomes

- Every slide must have clear visual hierarchy at first glance.
- Cover slide must be immediately readable on mobile and desktop.
- At least one major visual component must appear on most body/framing slides.
- Logo/profile treatment must be consistent and intentional.
- Typography, spacing, and color must feel system-driven, not ad hoc.

## 3. Visual Quality Bar

- Avoid plain text walls.
- Use layered composition:
  - Background layer
  - Content container layer
  - Accent/decorative layer
- Use cards, chips, panels, or blocks to group information.
- Keep whitespace purposeful. Do not leave large empty areas unless part of an intentional hero layout.
- Use density profiles intentionally (`compact`, `balanced`, `airy`) to avoid dead whitespace.
- Keep copy minimal and crisp:
  - Prefer 3 strong bullets over 4 weaker bullets
  - Use short lines that scan in under 2 seconds
  - Let visuals carry supporting detail

## 4. Layout Framework

Use a repeatable vertical rhythm:

1. Identity band (profile/logo/chip)
2. Headline zone
3. Primary content zone
4. Secondary visual zone (infographic/panel/diagram)
5. Brand anchor zone (profile/footer)

Safe area rules:

- Keep all critical text away from border frame and bottom bar.
- Maintain consistent left-right rhythm across slides.

## 5. Typography Rules

- Heading font: high-contrast display serif for emphasis.
- Body font: clean modern sans-serif with strong readability.
- Maintain strict scale:
  - Cover headline > slide headline > subheadline > body > caption.
- Avoid abrupt font jumps or mixing many styles.
- Do not use more than 2 font families in a deck.

## 6. Color and Contrast Rules

- Maintain one dominant accent per deck (with optional support accents).
- Always verify text/background contrast on cover and CTA slides.
- If cover uses a strong gradient, use a contrast card or overlay behind text.
- Decorative shapes must stay low-contrast relative to primary copy.
- Accent color must be used intentionally for emphasis, not everywhere.

## 7. Iconography Rules

- Icons must communicate category or action.
- Keep icon style consistent per deck:
  - Similar visual weight
  - Similar container treatment (chip, circle, or badge)
- Prefer one icon per bullet or card when it aids scanning.
- Do not overload slides with unrelated emoji noise.

## 8. Infographic Requirement

- Target 30 to 60 percent of non-cover slides with infographic components.
- Respect `planner.visualCoverageTarget` when provided.
- Do not produce more than one consecutive body slide with only raw bullet text.
- Approved components:
  - KPI cards
  - Insight cards
  - Process diagram
  - Comparison grid
  - Timeline
  - Matrix/quadrant

Use pattern definitions from `directives/INFOGRAPHIC_LIBRARY.md`.

No-duplication rule:
- Secondary panels must not repeat primary bullet text verbatim.
- If a side panel echoes bullets, convert it into conceptual pillars, KPI stats, or process structure.
- If panel relevance is weak, hide the panel instead of forcing generic filler cards.

Top-chip relevance rule:
- Use one primary contextual chip on body slides at most.
- `Workflow N` chip is allowed only on workflow/process slides.
- Do not force `Action Step` as a generic label on every body slide.
- If chip confidence is low, hide it.

Image-first rule:
- When possible, use generated visual assets (Imagen/Nano Banana style) for body/framing slides.
- If generated visuals are unavailable, use structured infographic cards as fallback.
- Generated visuals must be clean and non-cluttered:
  - No text overlays
  - One clear focal subject
  - Consistent color palette with deck accents

## 9. Slide-Type Design Rules

### Cover

- Must include strong hero treatment:
  - High-contrast headline
  - Visual brand anchor (logo or key symbol)
  - Compact value summary
- Keep copy concise and high impact.

### Framing

- Pair headline + supporting bullets with a contextual visual block.
- Use one small diagram or labeled structure to set mental model.

### Body

- Prefer two-column composition:
  - Narrative bullets on one side
  - Infographic support on the other
- If numbers are present, promote them to KPI cards.
- Use one visual mode per slide:
  - KPI cards, or cards, or chart, or image
  - Avoid mixed right-panel clutter
- Keep body copy tight:
  - 3 bullets preferred
  - 4 only when all lines are non-overlapping and essential

### CTA

- Keep simple but premium:
  - Strong headline
  - Single action line
  - Clean identity anchor
- Avoid clutter on CTA slide.

## 10. Design QA Gates (Pass/Fail)

Before delivery, confirm:

1. Readability

- Cover headline readable at a glance.
- No low-contrast text blocks.

1. Structure

- Clear hierarchy on every slide.
- No overcrowded zones or accidental empty voids.
- Top chip and visual panel labels must match slide intent.

1. Visual Components

- Infographic components used per minimum requirement.
- Visuals support meaning, not decoration only.

1. Brand Consistency

- Logo/profile placement consistent.
- Accent usage and typography consistent.

1. Production Polish

- No clipping, overlap, or misalignment.
- No encoding artifacts in text.
- No irrelevant chips or unrelated side-panel cards.

## 11. Fallback Rules

If data is weak for full infographic rendering:

- Use insight cards derived from bullets.
- Use process labels from key verbs.
- Use KPI placeholders only when numbers are explicit and real.

Never fake metrics.

## 12. Mandatory Oversight Sign-off

Before delivery:

- `directives/COPY_OVERSEER_AGENT.md` must pass
- `directives/DESIGN_OVERSEER_AGENT.md` must pass

If either fails:

- block delivery
- fix only rejected slides first
- re-render and re-check
