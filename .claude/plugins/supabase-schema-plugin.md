---
name: supabase-schema-plugin
description: |
  Lints Supabase migrations against specs/004-erd.md to ensure the database
  schema matches the spec. Catches drift between spec and actual schema.
type: validation
trigger: pre-commit
---

# supabase-schema-plugin

## Purpose

Prevent schema drift between `specs/004-erd.md` (the canonical schema) and
the actual migration files in `supabase/migrations/`. When a migration is
added or modified, validate it against the spec.

## What it checks

1. **Table existence**: Every table in the spec exists in migrations.
2. **Column presence**: Required columns from the spec are present.
3. **RLS enabled**: Every user-scoped table has `enable row level security`.
4. **Indexes**: Required indexes from the spec are present.
5. **Constraints**: Check constraints match the spec (e.g., status enums).
6. **pgvector**: Extension is enabled before `rag_chunks` table.

## Implementation approach

```typescript
// scripts/validate-schema.ts
// 1. Parse specs/004-erd.md to extract expected tables, columns, constraints
// 2. Parse supabase/migrations/*.sql to extract actual schema
// 3. Compare and report differences

// Expected tables from spec:
const EXPECTED_TABLES = [
  'profiles', 'email_accounts', 'messages', 'attachments',
  'memory_items', 'rag_chunks', 'scheduled_emails',
  'telegram_bindings', 'ai_actions', 'approval_requests'
];

// For each table, check:
// - CREATE TABLE exists
// - Required columns present
// - RLS enabled
// - Indexes created
```

## Usage

```bash
# Run schema validation
npx tsx scripts/validate-schema.ts

# Output on success:
# ✅ All 10 tables present
# ✅ RLS enabled on all user-scoped tables
# ✅ Required indexes present
# ✅ pgvector extension enabled

# Output on failure:
# ❌ Table 'approval_requests' missing from migrations
# ❌ Column 'ai_risk_reason' missing from 'messages'
# ❌ RLS not enabled on 'telegram_bindings'
```

## When to use

- After adding or modifying a migration file.
- Before deploying schema changes to Supabase.
- When `code-architect` reviews a schema PR.
- Part of the `validate:full` pipeline for schema-touching PRs.

## Integration with agents

- `code-architect` invokes this before approving schema changes.
- `build-validator` includes this in validation when migrations are staged.
- The spec is the authority — if the plugin reports a mismatch, either
  fix the migration or update the spec first.
