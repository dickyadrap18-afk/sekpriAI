---
name: vercel-release-plugin
description: |
  Pre-deploy gate runner for Vercel. Validates environment, OAuth, Telegram,
  and runs the full quality pipeline before allowing deployment.
type: deployment
trigger: manual
---

# vercel-release-plugin

## Purpose

Prevent broken deployments by running a comprehensive pre-deploy checklist.
This plugin is the gate between "code is ready" and "deploy to production."

## Pre-deploy gates

### Gate 1: Quality pipeline
```bash
npm run validate:full
# Must pass: lint, typecheck, test, build, e2e
```

### Gate 2: Environment variables
Check that `.env.example` lists all required variables and that they are
set in the Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL        ✅ set
NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅ set
NEXT_PUBLIC_APP_URL             ✅ set
SUPABASE_SERVICE_ROLE_KEY       ✅ set
ENCRYPTION_KEY                  ✅ set
GOOGLE_CLIENT_ID                ✅ set
GOOGLE_CLIENT_SECRET            ✅ set
MICROSOFT_CLIENT_ID             ✅ set
MICROSOFT_CLIENT_SECRET         ✅ set
AI_PROVIDER                     ✅ set
ANTHROPIC_API_KEY               ✅ set
TELEGRAM_BOT_TOKEN              ✅ set
TELEGRAM_WEBHOOK_SECRET         ✅ set
```

### Gate 3: OAuth redirect URIs
- Gmail: `https://<domain>/api/auth/callback/gmail`
- Office 365: `https://<domain>/api/auth/callback/office365`

### Gate 4: Telegram webhook
- URL: `https://<domain>/api/telegram/webhook/<secret>`

### Gate 5: Supabase
- All migrations applied
- RLS policies active
- Storage bucket `attachments` exists

## Implementation

```bash
# scripts/pre-deploy.sh
#!/bin/bash
set -e

echo "🔍 Gate 1: Quality pipeline..."
npm run validate:full

echo "🔍 Gate 2: Environment check..."
npx tsx scripts/check-env.ts

echo "🔍 Gate 3: OAuth URIs..."
# Manual verification prompt

echo "🔍 Gate 4: Telegram webhook..."
# Manual verification prompt

echo "🔍 Gate 5: Supabase..."
npx tsx scripts/validate-schema.ts

echo "✅ All gates passed. Ready to deploy."
```

## Usage

```bash
# Run pre-deploy validation
npm run pre-deploy

# Deploy (only after pre-deploy passes)
vercel --prod
```

## Integration

- `release-agent` uses this before every deployment.
- `vercel-release` skill references this plugin's checklist.
- The `build-validate-on-stop` hook covers Gate 1 automatically.
