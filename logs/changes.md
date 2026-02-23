# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-02-23

### Added
- `README.md`
  - Public-facing project summary, quickstart, commands, outputs, and doc links

- `docs/REPO_OVERVIEW.md`
  - High-level architecture and folder walkthrough for open-source users

- `docs/GITHUB_SETUP.md`
  - Step-by-step GitHub publishing and repository settings guide

- `docs/prompting/PROMPT_BEST_PRACTICES.md`
  - Prompt-writing standards for consistent high-quality outputs

- `docs/prompting/PROMPT_EXAMPLES.md`
  - 10 reusable prompt templates with placeholders and AI fill guidance

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `LICENSE`
- `.gitignore`
  - Standard open-source repo hygiene and governance files

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`
  - GitHub collaboration templates and baseline CI validation workflow

### Changed
- `directives/GEMINI.md`
  - Added docs + GitHub folder expectations in repository layout
  - Added open-source documentation maintenance rule

## [1.6.0] - 2026-02-23

### Added
- `scripts/run_overseer_checks.js`
  - Automated Copy Overseer + Design Overseer pass/fail checks
  - Emits deterministic reports:
    - `logs/<slug>_copy_overseer.json`
    - `logs/<slug>_design_overseer.json`

- `scripts/build_carousel.js`
  - One-command build pipeline:
    - charts -> images -> render -> validate -> overseer -> performance scaffold
  - Writes reproducibility manifest:
    - `logs/<slug>_build_manifest.json`
  - Honors `planner.runOverseerChecks=false` for draft runs

- `scripts/init_performance_log.js`
  - Initializes post-publish optimization tracker:
    - `logs/performance/<slug>.json`

- `directives/AUTOPILOT_PIPELINE.md`
  - Defines deterministic orchestration contract and artifact expectations

- `directives/POST_PUBLISH_OPTIMIZATION.md`
  - Defines performance tracking and iteration workflow

- `directives/FEATURE_ROADMAP.md`
  - Captures prioritized next-step upgrades and definition-of-done requirements

- `content/tests/regression_visual_coverage_fail.json`
  - Regression fixture to enforce visual coverage gating

### Updated
- `content/tests/regression_workflow_numbering.json`
  - Added visual panels so fixture remains valid under visual coverage rules

### Changed
- `scripts/validate_pdf.js`
  - Added claim-signal source warnings when `sourceRefs` and `metadata.sources` are missing
  - Added headline similarity warning between adjacent slides
  - Added render-intelligence quality gates:
    - visual coverage threshold check (default 30% or `planner.visualCoverageTarget`)
    - chip confidence threshold enforcement
    - visual confidence threshold enforcement
    - workflow chip sequence integrity checks
    - render-intelligence missing warning

- `scripts/render_html_to_pdf.js`
  - Added density profile resolver (`compact`, `balanced`, `airy`)
  - Includes `densityProfile` in template data and render intelligence output

- `templates/html/slide.html`
  - Added density class on slide root (`slide--density-...`)

- `templates/html/styles.css`
  - Added density-aware spacing behavior to reduce dead whitespace and preserve readability

- `schemas/carousel.schema.json`
  - Added planning fields:
    - `objective`
    - `narrativeMode`
    - `planner.visualCoverageTarget`
    - `planner.densityProfile`
    - `planner.researchFreshnessDays`
    - `planner.runOverseerChecks`
    - `experiments.*`
  - Added `metadata.sources` formal schema support
  - Added slide-level `sourceRefs` and `densityProfile`

- `package.json`
  - Added scripts:
    - `overseer`
    - `build-carousel`
    - `init-performance-log`

- `directives/GEMINI.md`
  - Added new directive modules to truth sources + precedence
  - Added one-command build path and pipeline artifact contract
  - Added planner controls and performance logging expectations

- `directives/SUB_AGENT_ORCHESTRATION.md`
  - Added Performance Analyst Agent role

- `directives/VISUAL_DECISION_ENGINE.md`
  - Added density profile resolution policy

- `directives/DESIGN_PREMIUM.md`
  - Added density profile usage note and planner coverage linkage

- `directives/CONTENT_INTELLIGENCE.md`
  - Added planner/experiment field usage guidance

- `directives/COPY_OVERSEER_AGENT.md`
- `directives/DESIGN_OVERSEER_AGENT.md`
  - Added automation path reference to overseer script

## [1.5.1] - 2026-02-23

### Added
- `directives/DESIGN_OVERSEER_AGENT.md`
  - Added dedicated final visual authority rubric with pass/fail scoring and blocking criteria

- `directives/COPY_OVERSEER_AGENT.md`
  - Added dedicated final copy authority rubric with duplication, clarity, and claim-integrity gates

- `content/final/20260223_antigravity_overseer_masterpiece.json`
  - New Anti-Gravity deck with explicit intent + visual mode control
  - Includes framework/workflow/proof/transition intent mix and explicit chart/KPI/cards usage

- `logs/research/20260223_antigravity_overseer_masterpiece.md`
  - Source-backed, date-aware research notes for the new Anti-Gravity deck

### Changed
- `directives/GEMINI.md`
  - Added new overseer directive files to truth sources and precedence
  - Added explicit research freshness expectations for fast-moving topics
  - Added mandatory overseer report artifacts in delivery flow

- `directives/SUB_AGENT_ORCHESTRATION.md`
  - Added specialized `Design Systems Agent`
  - Linked mandatory Design/Copy Overseer directive references
  - Updated handoff protocol and logging requirement for overseer outputs

- `directives/DESIGN_PREMIUM.md`
  - Added mandatory sign-off rules referencing Copy and Design Overseer directives

- `directives/CONTENT_INTELLIGENCE.md`
  - Added recency preference for fast-moving topic research
  - Added rule to treat Reddit/community inputs as directional, not proof

- `directives/VISUAL_ASSET_STRATEGY.md`
  - Expanded premium benchmark and alignment consistency requirements
  - Clarified image/chart generation behavior expectations

- `directives/INFOGRAPHIC_LIBRARY.md`
  - Added deterministic chart generation preference and panel density guidance

- `scripts/render_html_to_pdf.js`
  - Replaced emoji chip icons with stable glyph icons to prevent missing-glyph rendering artifacts

## [1.5.0] - 2026-02-23

### Added
- `directives/VISUAL_DECISION_ENGINE.md`
  - Deterministic intent resolution, top-chip rules, visual mode selection, and blocking fail conditions

- `directives/CONTENT_INTELLIGENCE.md`
  - Research-first content planning, copy compression, and evidence-aware narrative rules

- `directives/VISUAL_ASSET_STRATEGY.md`
  - Chart/infographic/image selection strategy and aesthetic quality gates

- `scripts/generate_chart_assets.js`
  - Generates chart PNG assets from explicit `slide.visual.chart` data
  - Writes chart manifest to `output/generated_charts/<slug>/manifest.json`

- `content/tests/regression_story_awards.json`
- `content/tests/regression_workflow_numbering.json`
- `content/tests/regression_low_signal_hide_panel.json`
- `content/tests/regression_duplicate_cards_fail.json`
- `content/tests/regression_explicit_chart.json`
  - Regression fixtures for chip relevance, visual fallback behavior, and chart/card validation guards

### Changed
- `scripts/render_html_to_pdf.js`
  - Added context-aware slide intent inference and single top-chip engine
  - Replaced forced body `Workflow` + `Action Step` labels with intent-based chip labels
  - Added deterministic visual mode selector (`none`, `kpi`, `cards`, `chart`, `image`)
  - Removed generic fallback side cards that caused irrelevant panel content
  - Added chart and image asset resolution paths
  - Added render intelligence log: `logs/<slug>_render_intelligence.json`

- `templates/html/slide.html`
  - Replaced static body chip with contextual `topChip`
  - Made side panel rendering mutually exclusive by visual mode
  - Added chart figure rendering support in side panel

- `templates/html/styles.css`
  - Added contextual top-chip styling variants
  - Added mode-specific panel behavior for KPI/cards/chart/image
  - Added chart image/footnote styles and stabilized panel alignment

- `schemas/carousel.schema.json`
  - Added `intent`, `chip`, and `visual` slide fields
  - Added explicit chart schema and visual stats/cards schema
  - Added top-level optional `profile`, `showRepostBadge`, and `colorOverride`
  - Preserved backward compatibility for legacy fields (`stepNumber`, `visualImage`)

- `scripts/validate_pdf.js`
  - Added blocking checks for:
    - workflow chip on non-workflow intent
    - invalid chip labels in auto/label mode (unless custom intent)
    - duplicate side cards versus primary bullets
    - invalid chart configuration when `visual.mode=chart`
  - Added warning for consecutive `visual.mode=none` body slides using render intelligence logs

- `directives/GEMINI.md`
  - Upgraded operating model to research-first smart planning flow
  - Added precedence and references for new directive modules
  - Added chart asset pipeline references and visual-mode rules

- `directives/DESIGN_PREMIUM.md`
  - Added single contextual top-chip policy and anti-irrelevance gates
  - Added exclusive visual mode guidance for cleaner side panels

- `directives/INFOGRAPHIC_LIBRARY.md`
  - Added chart panel pattern and explicit-data-only chart rule
  - Updated selection order and deterministic visual schema references

- `content/final/20260223_maaz_gsk_farewell_production.json`
  - Added explicit `intent` and `visual` blocks to remove irrelevant chips/panels
  - Replaced generic side-panel artifacts with contextual KPI/cards

- `package.json`
  - Added `generate-charts` script
  - Added `chart.js` dependency

## [1.4.0] - 2026-02-23

### Added
- `scripts/generate_imagen_assets.js`
  - Generates slide-level visual prompts for Imagen-style assets
  - Optionally calls Gemini/OpenAI-compatible image endpoint when API key is present
  - Saves prompt packs and generated images under `output/generated_images/<slug>/`

### Changed
- `scripts/render_html_to_pdf.js`
  - Added automatic workflow badge numbering for body slides
  - Added automatic headline accenting for body/framing slides when markers are missing
  - Added optional generated-image ingestion into infographic panels
  - Preserved anti-duplication logic for side-panel content

- `templates/html/slide.html`
  - Added image block support inside infographic panel
  - Added deterministic layout class for panel/no-panel state

- `templates/html/styles.css`
  - Improved badge styling and heading emphasis hierarchy
  - Tightened vertical rhythm to reduce excessive whitespace
  - Improved panel/card alignment and image rendering style

- `scripts/validate_pdf.js`
  - Added preferred bullet-density warning (favor 3 bullets)
  - Added duplicate bullet detection within slide
  - Adjusted headline-accent warnings to respect auto-accent mode

- `package.json`
  - Added `generate-images` script hook

- `directives/GEMINI.md`
  - Added image generation step to the operating model and script responsibilities
  - Added guidance for controlling whitespace through density and rhythm

- `directives/DESIGN_PREMIUM.md`
  - Added image-first visual rules and stricter body-copy density guidance

## [1.3.0] - 2026-02-23

### Changed
- `scripts/render_html_to_pdf.js`
  - Rewritten in clean UTF-8 to remove encoding artifacts
  - Added anti-duplication guard so side infographic cards do not mirror bullet text
  - Replaced bullet-clone insight cards with conceptual pillar cards
  - Improved stat extraction safety and content normalization

- `templates/html/slide.html`
  - Added deterministic body layout class toggle (`body-layout--with-panel`) for consistent alignment

- `templates/html/styles.css`
  - Tightened headline/intro width constraints for stable text alignment
  - Replaced `:has()` layout dependency with deterministic class-based layout
  - Improved bullet/panel spacing and card typography for cleaner composition

- `content/final/20260223_antigravity_advanced_workflows.json`
  - Reduced on-slide copy density (crisper, shorter bullets)
  - Preserved advanced workflow narrative while shifting emphasis to visuals

- `directives/DESIGN_PREMIUM.md`
  - Added explicit minimal-copy and no-duplication requirements

- `directives/GEMINI.md`
  - Added rules for minimal text defaults and non-duplicative secondary panels

## [1.2.0] - 2026-02-23

### Added
- `content/final/20260223_antigravity_advanced_workflows.json` - New researched Anti-Gravity carousel content spec
- `logs/research/20260223_antigravity_research.md` - Source-backed research notes for claims used in the Anti-Gravity deck

### Generated
- `output/pdf/20260223_antigravity_advanced_workflows.pdf`
- `output/images/20260223_antigravity_advanced_workflows/`
- `logs/20260223_antigravity_advanced_workflows_validation.json`

## [1.1.0] - 2026-02-23

### Added
- `directives/DESIGN_PREMIUM.md` - Mandatory production-grade visual design rules for future slide generations
- `directives/INFOGRAPHIC_LIBRARY.md` - Approved infographic patterns and pattern selection rules

### Changed
- `directives/GEMINI.md` updated to:
  - Treat new design directives as source-of-truth files
  - Define directive precedence for conflict resolution
  - Require design composition and infographic selection before rendering
  - Add production quality enforcement rules and visual QA checks
  - Update repository layout expectations to include new directive files

## [1.0.0] - 2026-02-07

### Added
- Initial project structure created
- `brand/brand_rules.json` - Brand configuration with colors, typography, spacing
- `schemas/carousel.schema.json` - JSON Schema for content spec validation
- `templates/html/slide.html` - Handlebars template for slide rendering
- `templates/html/styles.css` - CSS stylesheet with brand system
- `scripts/render_html_to_pdf.js` - Playwright-based PDF renderer
- `scripts/validate_pdf.js` - Content spec validator
- `content/tests/sample_short.json` - Sample content spec for testing
- `package.json` - Node.js project configuration

### Configuration
- Slide dimensions: 1080x1350px (LinkedIn 4:5 ratio)
- Primary color: Deep blue (#0A1628)
- Accent colors: Gold (#D4AF37), Blue (#3B82F6), Green (#10B981)
- Font: Inter
- Safe margins: 60px all sides
