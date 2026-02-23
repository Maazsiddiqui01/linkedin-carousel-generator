# Autopilot Pipeline Directive

Use this directive to run generation as a deterministic production pipeline.

## 1. Goal

Guarantee that each deck is built, validated, and overseer-approved with one command.

Primary command:

- `npm run build-carousel -- <content-spec.json>`

## 2. Required Step Order

1. Chart asset generation (`scripts/generate_chart_assets.js`)
2. Image prompt/asset generation (`scripts/generate_imagen_assets.js`)
3. Render (`scripts/render_html_to_pdf.js`)
4. Validate (`scripts/validate_pdf.js`)
5. Overseer checks (`scripts/run_overseer_checks.js`)
6. Performance tracking scaffold (`scripts/init_performance_log.js`)

The build must stop on first blocking failure.

## 3. Build Artifacts

Every run should produce:

- `output/pdf/<slug>.pdf`
- `output/images/<slug>/slide_*.png`
- `logs/<slug>_render_intelligence.json`
- `logs/<slug>_validation.json`
- `logs/<slug>_copy_overseer.json`
- `logs/<slug>_design_overseer.json`
- `logs/<slug>_build_manifest.json`
- `logs/performance/<slug>.json`

## 4. Planner Controls

Use optional planning fields in spec:

- `objective`
- `narrativeMode`
- `planner.visualCoverageTarget`
- `planner.densityProfile`
- `planner.researchFreshnessDays`
- `planner.runOverseerChecks` (default on; can be explicitly disabled for draft runs)

These fields should guide planning, validation, and review strictness.

## 5. Failure Policy

Do not deliver when any of the following fail:

- schema validation
- deterministic validation constraints
- copy overseer status
- design overseer status

## 6. Non-Optional Quality Gates

- visual coverage must meet target (default 30% of body slides)
- no semantic mismatch in workflow chip usage
- no repeated panel content mirroring bullets
- no unresolved validation issues

## 7. Delivery Contract

Final delivery message must include:

- exact output PDF path
- validation status summary
- overseer status summary
- known limitations (for example, missing image API key)
