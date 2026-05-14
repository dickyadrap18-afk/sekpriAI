---
name: vercel-release
description: |
  Pre-deploy checklist runner for Vercel deployment. Validates that all
  quality gates pass, env vars are configured, and the app is ready for
  production deployment.
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# Vercel Release Skill

## When to use

Invoke this skill before deploying to Vercel to run the full pre-deploy
checklist.

## Pre-deploy checklist

### 1. Quality gates
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (unit + integration)
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes

### 2. Environment variables
Verify all required env vars are set in Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
AI_PROVIDER
ANTHROPIC_API_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

### 3. OAuth callbacks
- [ ] Gmail OAuth redirect URI points to production URL
- [ ] Office 365 OAuth redirect URI points to production URL

### 4. Telegram webhook
- [ ] Webhook URL set to `https://<domain>/api/telegram/webhook/<secret>`

### 5. Supabase
- [ ] All migrations applied
- [ ] RLS policies active
- [ ] Storage bucket `attachments` exists with policies

### 6. Final smoke test
After deploy:
- [ ] Login works
- [ ] Inbox loads
- [ ] AI summary renders
- [ ] Telegram binding works

## What this skill does

1. Runs all quality gates in order (stops on first failure).
2. Checks `.env.example` against Vercel env var list.
3. Validates `vercel.json` configuration if present.
4. Reports pass/fail with actionable next steps.

## Usage

```
/vercel-release check    # Run pre-deploy checklist
/vercel-release deploy   # Deploy after checks pass
```
