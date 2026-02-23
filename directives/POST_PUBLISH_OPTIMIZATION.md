# Post-Publish Optimization Directive

Use this directive to close the loop between design/copy decisions and real performance.

## 1. Mission

Treat each carousel as an experiment and improve the next build using measured outcomes.

## 2. Tracking Standard

Create or update:

- `logs/performance/<slug>.json`

Track:

- impressions
- likes
- comments
- reposts
- saves
- profile visits
- follows
- CTR (if available)

## 3. Qualitative Signal Capture

Record:

- top comment themes
- objections or confusion patterns
- strongest and weakest slide numbers
- wording that triggered quality engagement

## 4. Iteration Rules

From each completed performance log, define:

- what to keep
- what to improve
- what to test next
- next variant slug

## 5. High-Value Experiments

Run small controlled variations:

- hook style (contrarian vs practical)
- CTA style (keyword comment vs DM ask)
- visual mode density (cards-heavy vs chart-heavy)
- headline emphasis style (single accent word vs phrase)

Do not change more than 2 major variables at once.

## 6. Planning Feedback Injection

Feed learned signals into future specs:

- `objective`
- `narrativeMode`
- `experiments.hookVariant`
- `experiments.ctaVariant`

## 7. Governance

Performance data guides future decisions, but never overrides factual integrity or design clarity requirements.
