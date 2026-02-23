# Repository Overview

## Purpose

AntiGravity Slides Generator is a production pipeline for creating high-quality LinkedIn carousel decks from structured content specs. It is designed to reduce manual design effort while maintaining premium visual quality and strict copy discipline.

## How It Works

The system follows a deterministic flow:

1. Plan content in JSON (`content/final/<slug>.json`)
2. Generate visual assets:
   - charts (`scripts/generate_chart_assets.js`)
   - image prompts/assets (`scripts/generate_imagen_assets.js`)
3. Render slides to PNG + PDF (`scripts/render_html_to_pdf.js`)
4. Validate quality and semantics (`scripts/validate_pdf.js`)
5. Run overseer gates (`scripts/run_overseer_checks.js`)
6. Save build + performance artifacts

## Key Design Concepts

- **Intent-aware slides**: each body slide has a narrative intent
- **Contextual top chip**: one relevant chip at most
- **Single panel mode**: KPI/cards/chart/image/none
- **Anti-duplication rules**: side panel must add new value
- **Density profiles**: compact/balanced/airy to control whitespace

## Main Folders

- `directives/` - operating rules and quality policies
- `schemas/` - JSON schema for content specs
- `templates/html/` - deterministic slide template + styles
- `scripts/` - generation, rendering, validation, orchestration
- `content/` - specs and tests
- `output/` - generated visuals and PDFs
- `logs/` - validation, intelligence, overseer, build, performance

## Who This Is For

- solo creators publishing LinkedIn carousels
- teams standardizing slide quality and process
- open-source contributors improving planning, design systems, and QA automation
