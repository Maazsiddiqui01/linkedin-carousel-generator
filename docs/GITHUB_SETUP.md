# GitHub Setup Guide

Use this guide to publish and maintain the repository as open source.

## 1. Pre-Publish Checklist

Confirm these files exist:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `docs/REPO_OVERVIEW.md`
- `docs/prompting/PROMPT_BEST_PRACTICES.md`
- `docs/prompting/PROMPT_EXAMPLES.md`

## 2. Initialize Git Locally

From repo root:

```bash
git init
git add .
git commit -m "Initial open-source release"
```

## 3. Create GitHub Repository

Create a new empty GitHub repo (without auto README/license since this repo already has them), then connect:

```bash
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

## 4. Recommended Repo Settings

- Enable branch protection for `main`
- Require pull request before merge
- Require CI checks to pass
- Enable Dependabot alerts
- Enable secret scanning

## 5. Optional Secrets

If you want automatic image generation in CI or local environments:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`

Without these keys, prompt packs are still generated.

## 6. Suggested Labels

- `bug`
- `enhancement`
- `documentation`
- `design-system`
- `prompting`
- `good first issue`

## 7. Suggested Release Flow

1. Create a release branch from `main`
2. Run:
   - `npm ci`
   - `npx playwright install chromium`
   - `npm run build-carousel -- content/final/<spec>.json`
3. Update `logs/changes.md`
4. Open PR and merge
5. Tag release (`vX.Y.Z`) and publish notes

## 8. Contributor Onboarding Message

Share this sequence with new contributors:

1. Read `README.md`
2. Read `docs/REPO_OVERVIEW.md`
3. Read `docs/prompting/*`
4. Run `npm ci` and install Playwright Chromium
5. Render `content/tests/sample_short.json`
6. Open their first PR using `CONTRIBUTING.md`
