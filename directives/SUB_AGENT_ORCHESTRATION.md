# Sub-Agent Orchestration Directive

Use this directive to run carousel production as a coordinated multi-agent system.

## 1. Objective

Turn the generator into an AI-powered planning and design studio where specialized agents collaborate and two overseers perform final quality control:

- Design Overseer Agent (final visual authority)
- Copy Overseer Agent (final narrative authority)

## 2. Agent Roles

### A. Research Agent

- Pull latest, source-backed information for unstable claims.
- Prefer primary sources (official docs, release notes, product pages).
- Record source notes in `logs/research/<slug>.md`.

### B. Content Strategist Agent

- Build the narrative arc and slide-level intent map.
- Select what belongs in headline vs intro vs bullets.
- Define where visual storytelling should replace extra text.

### C. Copy Agent

- Write concise, high-signal headlines and bullets.
- Enforce parallel structure and non-overlapping bullets.
- Keep on-slide copy minimal and conversion-oriented.

### D. Visual Strategy Agent

- Choose per-slide visual mode (`none`, `kpi`, `cards`, `chart`, `image`).
- Match visual mode to data/insight structure.
- Flag weak visual candidates early.

### E. Design Systems Agent (Specialized)

- Own visual direction for the full deck before rendering.
- Set palette behavior, contrast strategy, icon language, and visual rhythm.
- Ensure each slide uses the most suitable visual mechanism:
  - chart
  - KPI cards
  - process diagram
  - infographic cards
  - image illustration
- Prevent decorative decisions that reduce clarity.

### F. Asset Agent

- Generate or collect visual assets:
  - `scripts/generate_imagen_assets.js`
  - `scripts/generate_chart_assets.js`
- Ensure assets are clean, legible, and style-consistent.

### G. Layout Agent

- Apply template constraints and spacing rules.
- Ensure alignment, rhythm, and safe-area compliance.
- Prevent clipping and crowding.

### H. Validation Agent

- Run deterministic checks and validation scripts.
- Enforce blocking failures for relevance/duplication/schema violations.

### I. Performance Analyst Agent

- Initialize and maintain `logs/performance/<slug>.json`.
- Capture post-publish metrics and qualitative feedback.
- Recommend next-iteration experiments (hook, CTA, visual mode mix).

## 3. Oversight Agents (Mandatory)

### Design Overseer Agent

Runs after initial render and before delivery.

Reference:
- `directives/DESIGN_OVERSEER_AGENT.md`

Checks:

- visual hierarchy and balance
- context relevance of chips and panel visuals
- non-cluttered composition
- consistent style and alignment
- no irrelevant decorative or side-panel artifacts

Authority:

- can reject deck for redesign even if schema passes

### Copy Overseer Agent

Runs after copy draft and after design pass.

Reference:
- `directives/COPY_OVERSEER_AGENT.md`

Checks:

- clarity and brevity
- narrative coherence slide-to-slide
- elimination of duplication/redundancy
- claim quality (factual vs inferred clarity)
- CTA relevance and conversion strength

Authority:

- can reject deck for copy rewrite before final delivery

## 4. Handoff Protocol

Required sequence:

1. Research Agent -> source notes
2. Content Strategist Agent -> slide plan
3. Copy Agent -> draft copy
4. Visual Strategy Agent -> mode map
5. Design Systems Agent -> design orchestration pass
6. Asset Agent -> charts/images
7. Layout Agent -> render
8. Validation Agent -> pass/fail report
9. Copy Overseer Agent -> final copy approval
10. Design Overseer Agent -> final design approval
11. Delivery
12. Performance Analyst Agent -> post-publish learning loop setup

No final output is allowed without both overseers marked pass.

Both overseers must output machine-readable reports in `logs/` before delivery.

Preferred execution command:

- `npm run build-carousel -- <content-spec.json>`

## 5. Latest-Knowledge Rule

For any topic where capabilities, product features, or ecosystem tools can change:

- research must be refreshed before content finalization
- source notes must include date context
- uncertain claims must be softened or removed

## 6. Failure Escalation

If any overseer fails:

- block delivery
- return exact rejected slides and reasons
- iterate only on failed areas
- re-run validation and both overseer checks
