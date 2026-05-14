---
name: test-runner-plugin
description: |
  Canonicalizes the test gate order for sekpriAI. Ensures lint, typecheck,
  unit tests, build, and E2E run in the correct sequence both locally and in CI.
type: validation
trigger: manual
---

# test-runner-plugin

## Purpose

Provide a single command that runs all quality gates in the correct order,
stopping on first failure. Used by `build-validator` agent and CI pipeline.

## Gate order (strict)

```
1. npm run lint          # ESLint
2. npm run typecheck     # tsc --noEmit
3. npm run test          # Vitest (unit + integration)
4. npm run build         # Next.js production build
5. npm run test:e2e      # Playwright E2E (optional flag)
```

A failing earlier gate stops the pipeline. No point running build if
typecheck fails.

## Implementation

```json
// package.json scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build": "next build",
    "validate": "npm run lint && npm run typecheck && npm run test && npm run build",
    "validate:full": "npm run validate && npm run test:e2e"
  }
}
```

## Usage

```bash
# Run all gates except E2E (fast, for every change)
npm run validate

# Run all gates including E2E (before PR, before deploy)
npm run validate:full
```

## CI integration

The CI pipeline (GitHub Actions or Vercel) mirrors this exact order:

```yaml
steps:
  - run: npm ci
  - run: npm run lint
  - run: npm run typecheck
  - run: npm run test
  - run: npm run build
  - run: npm run test:e2e
```

## When to use

- After any code change (run `validate`).
- Before opening a PR (run `validate:full`).
- Before deploying to Vercel (run `validate:full`).
- The `build-validate-on-stop` hook runs `validate` automatically.
