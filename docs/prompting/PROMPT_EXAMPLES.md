# Prompt Examples (With Placeholders)

This file contains reusable prompt templates for high-quality deck generation.

Each example includes:

- Prompt template with placeholders
- AI filling guidance (how the system should infer/fill missing parts)

---

## 1. Thought Leadership Workflow Deck

### Prompt

Create a `<SLIDE_COUNT>` slide LinkedIn carousel on `<TOPIC>` for `<AUDIENCE>`.

Objective: `<OBJECTIVE>`.
Tone: `<TONE>`.
Color theme: `<COLOR_THEME>`.

Requirements:
- Keep text minimal and crisp (3 bullets preferred on body slides)
- Use intent-aware chips and avoid irrelevant workflow tags
- Include at least `<VISUAL_COVERAGE_TARGET>%` body-slide visual coverage
- Use chart mode where explicit series exists
- Use KPI/cards where numbers or frameworks are present
- End with CTA: `<CTA>`

Deliver:
- content spec in `content/final/`
- rendered PDF
- validation + overseer reports

### AI Filling Guidance

- If `<VISUAL_COVERAGE_TARGET>` missing, default to `45%`
- If `<SLIDE_COUNT>` missing, default to `8`
- If `<TONE>` missing, default to `practical, authoritative`

---

## 2. Personal Story / Milestone Deck

### Prompt

Build a personal story carousel from `<RAW_STORY_NOTES>` for `<AUDIENCE>`.

Goal: inspire and create credibility without sounding self-promotional.

Constraints:
- Use contextual chips (`Milestone`, `Story`, `Result`) only when relevant
- Never show `Workflow N` on story-only slides
- Use KPI panel only for real metrics (`<METRICS_LIST>`)
- Keep copy emotionally clear but concise
- CTA: `<CTA>`

### AI Filling Guidance

- Convert timeline notes into 3 phases: context -> milestones -> next move
- If `<METRICS_LIST>` empty, avoid fake metrics and use conceptual cards

---

## 3. Product Launch Deck

### Prompt

Create a launch carousel for `<PRODUCT_NAME>` targeting `<AUDIENCE>`.

Include:
- problem framing
- solution model
- 3 practical use cases
- rollout path

Visual rules:
- chart for adoption forecast if series data exists (`<SERIES_DATA>`)
- cards for use-case breakdown
- minimal whitespace

CTA: `<CTA>`

### AI Filling Guidance

- If `<SERIES_DATA>` absent, do not force chart mode
- Keep claims evidence-aware; use `sourceRefs` where possible

---

## 4. Case Study Deck (Proof-Focused)

### Prompt

Turn this case study into a premium carousel:
`<CASE_STUDY_NOTES>`

Audience: `<AUDIENCE>`
Objective: `<OBJECTIVE>`

Rules:
- lead with context and baseline
- focus on outcomes and proof
- use KPI cards with real values only
- avoid duplicate copy between bullets and side panel
- CTA: `<CTA>`

### AI Filling Guidance

- Extract numeric outcomes into `visual.stats`
- Move implementation steps into separate workflow-intent slides

---

## 5. Technical Teardown Deck

### Prompt

Create a teardown carousel on `<SYSTEM_OR_STACK>`.

Audience: `<AUDIENCE>`
Narrative mode: teardown

Must include:
- architecture overview
- key design tradeoffs
- failure modes
- implementation checklist

Visuals:
- cards for architecture layers
- optional chart for latency/cost trend using `<SERIES_DATA>`

### AI Filling Guidance

- Prefer framework + proof intents
- Keep one idea per slide; avoid overloaded technical paragraphs

---

## 6. Myth vs Reality Deck

### Prompt

Generate a myth-vs-reality carousel on `<TOPIC>` for `<AUDIENCE>`.

Slide structure:
- hook
- why myth persists
- 3 myth-vs-reality comparisons
- practical next actions
- CTA (`<CTA>`)

Design:
- strong hierarchy
- low text density
- no irrelevant chips/panels

### AI Filling Guidance

- Use comparison grid/card patterns where possible
- Keep each myth/reality line short and parallel

---

## 7. Beginner-Friendly Education Deck

### Prompt

Create a beginner-friendly carousel teaching `<TOPIC>` to `<AUDIENCE>`.

Constraints:
- plain language
- no jargon without short explanation
- 3 steps max per workflow slide
- include one adoption roadmap slide

Style: `<STYLE_REFERENCE>`
CTA: `<CTA>`

### AI Filling Guidance

- Convert jargon into simple action verbs
- Use transition intent before CTA to reduce cognitive jump

---

## 8. Data + Insight Deck

### Prompt

Build a data-driven carousel using these insights:
`<INSIGHT_NOTES>`

Audience: `<AUDIENCE>`
Objective: `<OBJECTIVE>`

Requirements:
- at least 2 chart/KPI slides
- chart data must be explicit, no invented values
- include implications and action points
- CTA: `<CTA>`

### AI Filling Guidance

- If data is partial, use one chart + one KPI slide + one cards slide
- Add `sourceRefs` for claim-heavy slides

---

## 9. Weekly Trend Roundup Deck

### Prompt

Create a weekly trend carousel:
- Domain: `<DOMAIN>`
- Date range: `<DATE_RANGE>`
- Audience: `<AUDIENCE>`

Need:
- top changes
- why they matter
- practical takeaways
- what to watch next week

Visual style: clean editorial, `<COLOR_THEME>`

### AI Filling Guidance

- Use `researchFreshnessDays` in planner
- Mark uncertain items as directional, not factual

---

## 10. Open-Source Project Showcase Deck

### Prompt

Create a carousel introducing this repository to new contributors.

Inputs:
- repo: `<REPO_NAME>`
- who it helps: `<AUDIENCE>`
- what makes it unique: `<UNIQUE_VALUE>`
- starter path: `<GETTING_STARTED_STEPS>`

Include:
- what it does
- architecture flow
- quickstart
- contribution CTA

### AI Filling Guidance

- Use framework intent for architecture slide
- Use transition intent for onboarding CTA slide
- Keep examples practical and contributor-friendly

---

## Universal Placeholder List

- `<TOPIC>`
- `<AUDIENCE>`
- `<OBJECTIVE>`
- `<SLIDE_COUNT>`
- `<CTA>`
- `<COLOR_THEME>`
- `<SERIES_DATA>`
- `<RAW_STORY_NOTES>`
- `<INSIGHT_NOTES>`
- `<STYLE_REFERENCE>`
