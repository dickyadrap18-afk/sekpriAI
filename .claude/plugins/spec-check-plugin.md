---
name: spec-check-plugin
description: |
  Asserts that PRs touching features/* have a corresponding spec entry.
  Prevents implementation without documentation.
type: validation
trigger: pre-commit
---

# spec-check-plugin

## Purpose

Enforce the "specs before code" rule. Any commit that touches files under
`features/`, `lib/providers/`, or `app/api/` must reference a spec entry.

## How it works

1. On pre-commit, scan staged files for paths matching:
   - `features/**/*`
   - `lib/providers/**/*`
   - `app/api/**/*`
2. If matches found, check that the commit message or PR description
   references a spec file (e.g., `specs/006-provider-integration-spec.md`).
3. If no spec reference found, warn (not block) with:
   ```
   ⚠️ This change touches feature code but doesn't reference a spec.
   Please ensure a spec exists for this feature before merging.
   ```

## Implementation

```bash
# scripts/spec-check.sh
#!/bin/bash
STAGED=$(git diff --cached --name-only)
FEATURE_FILES=$(echo "$STAGED" | grep -E '^(features/|lib/providers/|app/api/)')

if [ -n "$FEATURE_FILES" ]; then
  COMMIT_MSG=$(cat "$1" 2>/dev/null || echo "")
  if ! echo "$COMMIT_MSG" | grep -qE 'specs/[0-9]{3}'; then
    echo "⚠️  Feature code changed without spec reference."
    echo "   Files: $FEATURE_FILES"
    echo "   Add 'Ref: specs/NNN-name.md' to your commit message."
  fi
fi
```

## Integration

- Add to `.husky/commit-msg` hook when Husky is set up (Phase 1).
- Non-blocking warning (exit 0) — the agent should still check manually.
- The `spec-check-before-task` hook in `.claude/hooks/` provides the
  agent-side enforcement.

## When this fires

- Any commit touching feature implementation code.
- Does NOT fire for: docs, specs, scripts, config files, tests-only changes.
