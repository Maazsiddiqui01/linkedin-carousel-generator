# Contributing

Thanks for contributing to AntiGravity Slides Generator.

## Development Setup

```bash
npm ci
npx playwright install chromium
```

## Typical Contribution Flow

1. Create a feature branch
2. Implement changes
3. Run regression checks
4. Update docs/directives if behavior changed
5. Update `logs/changes.md`
6. Open pull request

## Local Validation Commands

```bash
npm run render -- content/tests/sample_short.json
npm run validate -- content/tests/sample_short.json
npm run overseer -- content/tests/sample_short.json
```

Recommended full run:

```bash
npm run build-carousel -- content/final/20260223_antigravity_overseer_masterpiece.json
```

## Contribution Standards

- Keep changes deterministic when possible
- Avoid introducing irrelevant visual defaults
- Preserve no-duplication and context-aware chip logic
- Add or update regression fixtures for new behavior
- Keep directives and implementation aligned

## PR Checklist

- [ ] Feature works end-to-end
- [ ] Validation passes (or expected failure is documented)
- [ ] Directives updated
- [ ] Changelog updated
- [ ] No unrelated file churn
