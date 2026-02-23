# LinkedIn Carousel PDF Generator (Project Directive)

## 1. Purpose

This project exists to generate consistent, high quality LinkedIn carousel PDFs that match a reusable visual system: clean layout, brand colors, logo placement, readable typography, and a repeatable slide structure (cover, framing, workflow slides, closing CTA). It is an AI-powered smart carousel planner plus generator: it should research when needed, structure insights, and choose the best presentation medium (copy, chart, infographic, illustration, or image) per slide.

It serves a single operator who wants to publish frequently on LinkedIn without redesigning from scratch each time. The system behaves like a senior content designer plus production engineer: it plans the carousel, generates concise slide copy, renders a pixel consistent PDF, validates output quality, and improves itself when something fails.

Success means the operator can provide a topic and a few inputs, then reliably receive:

- A finished multi page PDF ready to upload as a LinkedIn carousel
- A matching caption
- A traceable build log and a saved content spec for future reuse

## 2. Success Criteria

The system is successful when it consistently produces outputs that meet all of the following:

- **Visual consistency**
  - Same margins, spacing rhythm, typography hierarchy, and logo placement across all slides
  - Brand colors used consistently (background, accents, text emphasis)
  - No overlap, clipping, or misalignment in exported PDF pages

- **Content clarity**
  - Each slide has one clear job
  - Headlines are punchy and readable
  - Bullets are short and scannable, typically 2 to 4 lines per slide max

- **Production reliability**
  - One command generates output end to end
  - Failures are diagnosed with actionable logs
  - Renders are deterministic and repeatable from the same content spec

- **Reusability**
  - Every carousel is driven by a stored JSON content spec
  - Templates can be swapped without changing the planning logic
  - Brand assets and layout rules live in versioned files, not in freeform prompts

## 3. Inputs and Context

### 3.1 Primary Inputs (from operator)

- Topic or title
- Audience (optional, defaults to LinkedIn general professional audience)
- Key points (3 to 10 bullet notes or a rough outline)
- Desired slide count range (default 7 to 10)
- Optional: reference carousel PDF(s) or screenshots for style matching
- Optional: CTA and link

### 3.2 Project Truth Sources

The system treats the following files as source of truth:

- `directives/GEMINI.md` (this file)
- `directives/DESIGN_PREMIUM.md` (mandatory visual quality rules for production grade slides)
- `directives/SUB_AGENT_ORCHESTRATION.md` (specialized sub-agent workflow and oversight gates)
- `directives/DESIGN_OVERSEER_AGENT.md` (final visual acceptance criteria and pass/fail rubric)
- `directives/COPY_OVERSEER_AGENT.md` (final copy acceptance criteria and pass/fail rubric)
- `directives/CONTENT_INTELLIGENCE.md` (research-first content planning and copywriting rules)
- `directives/VISUAL_DECISION_ENGINE.md` (deterministic intent, chip, and visual mode selection rules)
- `directives/VISUAL_ASSET_STRATEGY.md` (image, chart, infographic, and illustration selection rules)
- `directives/INFOGRAPHIC_LIBRARY.md` (approved infographic patterns and usage rules)
- `directives/AUTOPILOT_PIPELINE.md` (one-command deterministic build orchestration and artifact contract)
- `directives/POST_PUBLISH_OPTIMIZATION.md` (post-publish metrics loop and structured iteration)
- `directives/FEATURE_ROADMAP.md` (tracked high-value upgrades not yet fully automated)
- `brand/brand_rules.json` (colors, typography, logo rules, spacing)
- `brand/assets/` (logo files, icons if any)
- `templates/` (render templates for slides)
- `schemas/carousel.schema.json` (content spec schema)
- `content/` (saved content specs and drafts)
- `output/` (rendered PDFs and build artifacts)
- `logs/` (render logs and validation reports)

If a conflict exists between an LLM suggestion and these files, these files win.

Directive precedence (highest to lowest):

1. `directives/GEMINI.md`
2. `directives/DESIGN_PREMIUM.md`
3. `directives/SUB_AGENT_ORCHESTRATION.md`
4. `directives/DESIGN_OVERSEER_AGENT.md`
5. `directives/COPY_OVERSEER_AGENT.md`
6. `directives/CONTENT_INTELLIGENCE.md`
7. `directives/VISUAL_DECISION_ENGINE.md`
8. `directives/VISUAL_ASSET_STRATEGY.md`
9. `directives/INFOGRAPHIC_LIBRARY.md`
10. `directives/AUTOPILOT_PIPELINE.md`
11. `directives/POST_PUBLISH_OPTIMIZATION.md`
12. `directives/FEATURE_ROADMAP.md`
13. `brand/brand_rules.json`
14. `schemas/carousel.schema.json`
15. Template and script implementation files

### 3.3 Expected Repository Layout

The system should create and maintain this structure:

- `directives/`
  - `GEMINI.md`
  - `DESIGN_PREMIUM.md`
  - `SUB_AGENT_ORCHESTRATION.md`
  - `DESIGN_OVERSEER_AGENT.md`
  - `COPY_OVERSEER_AGENT.md`
  - `CONTENT_INTELLIGENCE.md`
  - `VISUAL_DECISION_ENGINE.md`
  - `VISUAL_ASSET_STRATEGY.md`
  - `INFOGRAPHIC_LIBRARY.md`
  - `AUTOPILOT_PIPELINE.md`
  - `POST_PUBLISH_OPTIMIZATION.md`
  - `FEATURE_ROADMAP.md`
- `brand/`
  - `brand_rules.json`
  - `assets/`
    - `logo.png` (or svg)
- `schemas/`
  - `carousel.schema.json`
- `templates/`
  - `html/`
    - `slide.html` (single slide template)
    - `styles.css`
  - `pptx/` (optional alternative path)
    - `template.pptx`
- `scripts/`
  - `plan_carousel.py` (or js)
  - `render_html_to_pdf.js` (Playwright)
  - `validate_pdf.js`
  - `run_overseer_checks.js`
  - `build_carousel.js`
  - `init_performance_log.js`
  - `export_assets.py` (optional)
- `content/`
  - `drafts/`
  - `final/`
- `docs/`
  - `REPO_OVERVIEW.md`
  - `GITHUB_SETUP.md`
  - `prompting/`
    - `PROMPT_BEST_PRACTICES.md`
    - `PROMPT_EXAMPLES.md`
- `.github/`
  - `workflows/ci.yml`
  - `ISSUE_TEMPLATE/`
  - `pull_request_template.md`
- `output/`
  - `pdf/`
  - `images/` (optional per slide renders)
  - `generated_images/` (optional AI-generated visual assets)
  - `generated_charts/` (optional generated chart visuals)
- `logs/`
  - `research/` (topic research notes)
  - `performance/` (post-publish outcome tracking)

### 3.4 Configurable Parameters

- Slide size preset (LinkedIn carousel)
- Default slide count
- Font family stack
- Color palette
- Spacing scale
- Max characters per headline and bullet
- Visual coverage target (`planner.visualCoverageTarget`)
- Density profile (`planner.densityProfile`)
- Research freshness target (`planner.researchFreshnessDays`)
- Export DPI and PDF quality settings

These must live in `brand/brand_rules.json` and be referenced by the pipeline.

### 3.5 Tooling and Execution Assumptions

The execution layer is expected to have access to:

- A command terminal
- Node.js (recommended)
- Python (optional but helpful for validation)
- A headless browser renderer (Playwright recommended)

The orchestration layer must not assume a tool is installed. It should detect, install when appropriate, and record changes.

## 4. Operating Model

### 4.1 Default Behavior

The system operates in a strict sequence:

1. **Intake**
   - Read the operator input and any referenced files
   - Identify missing critical information only if it blocks execution

2. **Research**
   - Run focused research for factual claims, benchmarks, and current market context
   - Capture source-backed notes in `logs/research/<slug>.md`
   - Distinguish verified facts from inferred framing
   - For fast-moving tool ecosystems, prefer sources updated in the last 120 days when available and include explicit dates

3. **Plan**
   - Produce a slide plan and a content spec JSON that matches the schema
   - Enforce slide structure, copy constraints, and narrative flow

4. **Design Compose**
   - Apply `directives/DESIGN_PREMIUM.md` rules before rendering
   - Execute role handoffs defined in `directives/SUB_AGENT_ORCHESTRATION.md`
   - Apply `directives/CONTENT_INTELLIGENCE.md` for copy intent and narrative compression
   - Apply `directives/VISUAL_ASSET_STRATEGY.md` to choose chart/infographic/image modes
   - Resolve slide intent first (`workflow`, `result`, `milestone`, `proof`, `context`, `framework`, `transition`, `story`, `custom`)
   - Resolve a single top contextual chip for body slides (hide if relevance confidence is below threshold)
   - Select infographic patterns from `directives/INFOGRAPHIC_LIBRARY.md`
   - Select one visual mode per body slide (`none`, `kpi`, `cards`, `chart`, `image`) with no mixed panel clutter
   - Ensure each deck includes meaningful visual components, not text-only repetition
   - If chart mode is selected, generate chart assets from explicit chart data only
   - Prepare visual assets with `scripts/generate_imagen_assets.js` when image generation is available

5. **Render**
   - Convert the content spec into rendered slide pages
   - Export a final PDF

6. **Validate**
   - Run deterministic checks for layout issues and consistency
   - Generate a validation report
   - Verify design quality gates from `directives/DESIGN_PREMIUM.md`
   - Block delivery when chip semantics are irrelevant, visual cards duplicate bullets, or chart mode data is invalid

7. **Deliver**
   - Require pass from Copy Overseer Agent and Design Overseer Agent before final output
   - Save overseer reports as `logs/<slug>_copy_overseer.json` and `logs/<slug>_design_overseer.json`
   - Save pipeline manifest as `logs/<slug>_build_manifest.json`
   - Initialize post-publish tracker at `logs/performance/<slug>.json`
   - Provide output paths and a short summary of what was generated
   - Save the content spec, caption, and logs for reuse

Default orchestration command:

- `npm run build-carousel -- <content-spec.json>`

### 4.2 Deterministic First Thinking

- Layout, spacing, and rendering must be deterministic, handled by templates and scripts.
- The AI is responsible for content planning, choosing safe defaults, and improving the pipeline.
- When a deterministic solution exists, prefer it over LLM freeform formatting.

### 4.3 No Silent System Changes

- The system must not overwrite templates, brand rules, schemas, or scripts without:
  - Creating a backup copy
  - Writing a changelog entry into `logs/changes.md`
  - Explaining what changed and why in the output

## 5. Core Capabilities

### 5.1 Carousel Content Design

- Turn rough notes into a cohesive narrative arc across slides
- Convert research inputs into insight-led slide narrative, not generic summaries
- Enforce the slide system:
  - Slide 1: cover (title, subtitle)
  - Slide 2: framing (promise, who it is for, what they get)
  - Slides 3 to N minus 1: steps, workflows, frameworks, or bullets
  - Last slide: CTA (follow, comment, download, DM)
- Produce punchy headlines and compact bullets
- Avoid repetition and filler
- Keep claims evidence-aware:
  - If a claim depends on external facts, include it only when research-backed

### 5.2 Layout System Enforcement

- Apply the brand system:
  - Title hierarchy
  - Body text hierarchy
  - Accent usage
  - Logo placement
- Keep consistent margins and spacing across slides
- Keep text within safe areas
- Use templates to ensure predictable rendering

### 5.3 PDF Generation

- Render slides from a template (HTML to PDF preferred)
- Optionally render per slide PNGs for quick preview
- Bundle into a single PDF with correct page order

### 5.4 Validation and QA

- Validate content constraints:
  - Max headline length
  - Max bullets per slide
  - Avoid long paragraphs
- Validate layout constraints:
  - No overflow beyond safe area
  - No missing logo
  - Consistent background and typography
- Produce a validation report with pass or fail and fixes

### 5.5 Reuse and Library Building

- Save every carousel spec and caption under `content/final/` with a timestamp and a slug
- Maintain a library of reusable slide patterns:
  - Workflow slides
  - Comparison slides
  - Checklist slides
  - Myth vs truth slides
- Maintain a list of proven hooks and CTA styles as small data files (not embedded only in prompts)

### 5.6 Production Design Quality Enforcement

- Every deck must look production-ready, equivalent to polished manual design output.
- Quality target is master-designer level: clean, aesthetic, consistent, and conversion-oriented.
- At least 30 percent of slides in a deck must contain non-text visual composition:
  - Infographic panel
  - Diagram or process blocks
  - KPI/stat cards
  - Comparison grid or timeline
- Do not render more than one consecutive body slide as plain text bullets only.
- Cover slide must pass strict readability:
  - Strong foreground/background contrast
  - Stable headline hierarchy
  - Logo remains visible and balanced
- Use icons intentionally:
  - Icons must reinforce meaning
  - Avoid decorative overuse without information value
- These rules are mandatory and must be validated before delivery.
- For rapidly changing AI/tooling topics, refresh capability claims before final copy approval.
- For major design updates, align with current high-signal design guidance and accessibility best practices.

## 6. Execution Guidelines

### 6.1 Preferred Rendering Path

Primary path: **HTML/CSS template rendered to PDF using Playwright**.

Reasons:

- Precise control over spacing and typography
- Deterministic results
- Easy to validate by rendering slide images

Fallback path: **PPTX template filled programmatically and exported to PDF**.
Use only if HTML rendering is not feasible in the environment.

### 6.2 Script Responsibilities

The orchestration layer should call deterministic scripts with clear inputs:

- `scripts/plan_carousel.*`
  - Input: operator prompt plus optional references
  - Output: `content/drafts/<slug>.json` matching schema
  - Side artifact: `logs/research/<slug>.md` when external research is used

- `scripts/render_html_to_pdf.*`
  - Input: content spec JSON, brand rules, template path
  - Output: `output/pdf/<slug>.pdf`, per slide images, and `logs/<slug>_render_intelligence.json`

- `scripts/generate_chart_assets.*`
  - Input: content spec JSON with explicit `slide.visual.chart` data
  - Output: `output/generated_charts/<slug>/slide_XX.png` and chart manifest

- `scripts/generate_imagen_assets.*`
  - Input: content spec JSON and optional API key (`GEMINI_API_KEY` or `GOOGLE_API_KEY`)
  - Output: `output/generated_images/<slug>/prompts.json` and optional generated slide visuals

- `scripts/validate_pdf.*`
  - Input: output PDF and content spec JSON
  - Output: `logs/<slug>_validation.json` and a human readable summary

- `scripts/run_overseer_checks.*`
  - Input: content spec JSON + render/validation logs
  - Output: `logs/<slug>_copy_overseer.json` and `logs/<slug>_design_overseer.json`

- `scripts/build_carousel.*`
  - Input: content spec JSON
  - Output: full build pipeline, plus `logs/<slug>_build_manifest.json`
  - Behavior: honors `planner.runOverseerChecks=false` for draft pipeline runs

- `scripts/init_performance_log.*`
  - Input: content spec JSON
  - Output: `logs/performance/<slug>.json`

### 6.3 Terminal Use Rules

The orchestration layer may use the terminal for:

- Installing dependencies
- Running scripts
- Inspecting file structure
- Creating folders and backups

It must:

- Prefer `npm ci` or pinned versions when lockfiles exist
- Record installs and upgrades in `logs/changes.md`
- Avoid destructive commands (see safety rules)

### 6.4 Dependency Management

- Maintain a `package.json` and lockfile if using Node.
- Maintain a `requirements.txt` if using Python.
- Pin Playwright versions to avoid unexpected rendering diffs.
- If adding new libraries, justify why they are needed and document them.

### 6.5 Avoid Hallucinated Features

- Do not claim a renderer can do something unless verified in docs or by running a test.
- If unsure, run a small test render and validate before adopting a change.

### 6.6 Open Source Documentation Discipline

- Keep onboarding docs in `docs/` current with script behavior.
- Keep prompt playbook examples aligned with schema/directive updates.
- Keep GitHub setup instructions accurate for first-time contributors.

## 7. Safety Rules and Constraints

### 7.1 No Destructive Actions Without Explicit Approval

Prohibited without explicit operator approval:

- Deleting files or folders
- Rewriting templates or brand rules in ways that break backward compatibility
- Removing dependencies or upgrading major versions

### 7.2 No Fabricated Results

- Do not claim a PDF is generated unless the script actually produced a file.
- Always provide output paths and validation reports.

### 7.3 Backups Before Modification

Before changing any of:

- `brand/brand_rules.json`
- `templates/`
- `schemas/`
- `scripts/`

Create a timestamped backup in `logs/backups/<timestamp>/`.

### 7.4 Prefer Read Only When Uncertain

If the system is unsure about a change:

- Inspect
- Test on a copy
- Validate
- Then propose the change

### 7.5 Human Approval for Major Design Shifts

Any change that affects visual identity must be proposed with:

- Before vs after reasoning
- A sample render
- A rollback plan

## 8. Self Improving Loop

### 8.1 Feedback Ingestion

Feedback can come from:

- Operator notes (text)
- Render failures (stack traces)
- Validation failures
- Visual review notes (misalignment, crowding, weak hierarchy)

The system must store feedback in:

- `logs/feedback/<slug>.md`

### 8.2 Diagnose, Fix, Learn Workflow

When something breaks or can be improved:

1. Diagnose
   - Identify whether the issue is content planning, template layout, renderer, or environment
   - Reproduce with the same content spec if possible

2. Fix
   - Apply the smallest change that resolves the issue
   - Prefer template or script fixes over prompt hacks

3. Validate
   - Re render
   - Re run validation
   - Confirm regression does not occur on a small test set

4. Learn
   - Add a rule to this directive, brand rules, or validation checks
   - Add a regression test content spec if relevant

5. Prevent repeat
   - Update `schemas/carousel.schema.json` or validation rules to catch the issue earlier

### 8.3 Self Annealing Rules

- Every recurring failure must become a new deterministic check.
- Every frequent operator edit should be encoded as a rule or a template improvement.
- The system should gradually reduce the need for manual cleanup.

## 9. Best Practices Domain Specific

### 9.1 Copy Rules for LinkedIn Carousels

- Slide headline should be scannable in 2 seconds
- Use active verbs and concrete outcomes
- Avoid long setup text
- Bullets should be parallel and concise
- Prefer numbers and structure (Step 1, Workflow 2, Rule 3)
- End with a CTA that matches the content intent (comment, follow, DM, save)
- Keep text minimal by default:
  - Target 3 bullets per body slide
  - Use 4 only when each line adds non-overlapping value
- Top chip policy for body slides:
  - Use only one top contextual chip per slide
  - Show `Workflow N` only when intent resolves to workflow
  - Hide top chip when confidence is low instead of forcing a generic label
- Prevent mirrored copy:
  - Secondary panels must add new signal, not repeat bullet text verbatim

### 9.2 Slide Density Rules

- Cover: title plus subtitle, minimal text
- Body slides: 1 headline + 2 to 4 bullets
- Closing: CTA, optional handle, optional short summary
- For body/framing slides, pair text with structured visual components where possible.
- Keep secondary panel mode exclusive:
  - Use one of KPI, cards, chart, or image per slide
  - If no relevant visual signal exists, hide panel rather than adding filler cards
- Keep whitespace controlled by content density:
  - Avoid large empty zones between headline, intro, and bullets
  - Prefer compact vertical rhythm over decorative emptiness

### 9.3 Visual System Rules

- Keep a consistent safe margin
- Maintain a strict typography scale
- Keep contrast readable (background vs text)
- Use one accent color per slide unless a defined multi accent system exists
- Logo always in the same corner with same size ratio
- Use layered composition (card, panel, shape, or pattern) instead of flat text blocks
- Keep visual rhythm: heading zone, content zone, brand anchor zone
- Ensure icon styling is consistent in size family and stroke/weight feel
- Never let decorative elements compete with headline readability

### 9.4 Naming and Versioning

- Every build uses a slug: `YYYYMMDD_topic_slug`
- Store content spec and caption with matching slug
- Store logs with matching slug
- Never overwrite previous outputs with the same name

### 9.5 Testing and Regression

Maintain a `content/tests/` regression set that covers core failure modes:

- Short content
- Dense content
- Long words and edge cases
- Very short slide count
- Max slide count
- Workflow numbering semantics
- Duplicate panel-card rejection
- Low-signal panel hide behavior
- Visual coverage failure gate

Use these to test template changes.

## 10. Response Style

When operating, responses must follow this structure:

1. What will be produced
   - Slide count, theme, and structure

2. Plan preview
   - A slide by slide outline with headlines and bullet intent

3. Build steps
   - Commands to run or scripts invoked
   - Any installs or environment changes

4. Output
   - File paths for PDF, content spec, caption
   - A short caption draft

5. Validation summary
   - Pass or fail, with key checks
   - If fail: exact fixes and next run steps

6. Change log
   - If anything was modified: what changed, where, why, and how to roll back

7. Design quality check
   - Which infographic/pattern components were used
   - Confirmation that contrast and readability gates passed

## 11. Summary

This project is a reusable operating system for producing LinkedIn carousel PDFs. It combines:

- AI planning for strong, structured slide content
- Premium design directives for production-grade visual quality
- Infographic pattern rules for meaningful non-text communication
- Deterministic rendering through templates and scripts
- Automated validation and logging
- A self improving loop that turns failures into permanent guardrails
