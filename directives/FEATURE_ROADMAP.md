# Feature Roadmap Directive

Use this file to track high-impact upgrades that are not yet fully automated.

## 1. Next Priorities

### A. Visual QA Automation (Computer Vision)

Goal:

- Detect clipping, overlap, and optical misalignment from rendered PNGs.

Suggested implementation:

- use image analysis library to detect text block boundaries and spacing variance
- emit per-slide visual QA scores

### B. Accessibility Contrast Engine

Goal:

- Enforce WCAG contrast thresholds for headline/body/chip text.

Suggested implementation:

- parse effective colors after overrides
- compute contrast ratio and block low-contrast combinations

### C. Caption Variant Engine

Goal:

- Generate 2-3 controlled caption variants tied to objective and CTA style.

Suggested implementation:

- deterministic templates with variable hook + proof + CTA phrasing
- save to `content/final/<slug>_caption_variants.json`

### D. Multi-Theme Deck Packs

Goal:

- Allow selecting premium visual packs (corporate, editorial, tech, founder-story).

Suggested implementation:

- theme token files under `brand/themes/`
- per-pack typography, accents, and chip style rules

### E. Post-Publish Recommendation Engine

Goal:

- Convert performance logs into planning recommendations automatically.

Suggested implementation:

- score previous decks on saves/comments/follows efficiency
- recommend next `objective`, `narrativeMode`, and visual mix

## 2. Definition of Done for New Features

Any roadmap feature must include:

- schema support (if applicable)
- deterministic script implementation
- directive updates
- regression fixture
- changelog entry

## 3. Prioritization Rule

Prioritize features that improve:

1. delivery reliability
2. visual clarity
3. conversion outcomes
4. reuse speed
