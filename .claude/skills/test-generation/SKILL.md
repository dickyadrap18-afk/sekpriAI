---
name: test-generation
description: |
  Generates test scaffolds for a feature module. Creates Vitest unit tests,
  integration tests, and Playwright E2E test skeletons following the testing
  spec (specs/008-testing-spec.md).
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# Test Generation Skill

## When to use

Invoke this skill when you need to create test files for a new or existing
feature module.

## What it generates

### Unit tests (`*.test.ts` next to source):
- Test file for each pure function, parser, normalizer, or classifier.
- Uses Vitest with `describe/it/expect` pattern.
- Includes happy path, edge cases, and error cases.

### Integration tests (`*.integration.test.ts`):
- Tests that exercise server modules with mocked external HTTP (using `msw`).
- Tests that verify Supabase interactions with RLS.

### E2E tests (`tests/e2e/<feature>.spec.ts`):
- Playwright test skeleton for browser flows.
- Includes desktop and mobile viewport variants.
- Tests loading, empty, error, and success states.

## Template structure

```ts
// features/<name>/server/<module>.test.ts
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from './<module>';

describe('<module>', () => {
  describe('<functionName>', () => {
    it('should handle happy path', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case: empty input', () => {
      // ...
    });

    it('should handle error case: invalid data', () => {
      // ...
    });
  });
});
```

## Rules

- Unit tests must be fast (no network, no DB).
- Integration tests mock external HTTP with `msw`.
- E2E tests run against a real dev server.
- Test files live next to the code they test (unit/integration).
- Cross-feature E2E tests live in `tests/e2e/`.
- Use descriptive test names that explain the behavior, not the implementation.
- Never test implementation details (private methods, internal state).
- Every test must be independent (no shared mutable state between tests).

## Coverage targets

From `specs/008-testing-spec.md`:
- Provider normalization
- AI prompt parsers (priority, risk, draft, memory, channel intent)
- RAG chunker
- Crypto helpers (encrypt/decrypt round-trip)
- Sync pipeline (integration)
- Send pipeline with approval gate (integration)
- Telegram webhook flow (integration)
- Full user flows (E2E)

## Usage

```
/test-generation <feature-name> [unit|integration|e2e|all]
```

Example: `/test-generation email unit`
Example: `/test-generation channels all`
