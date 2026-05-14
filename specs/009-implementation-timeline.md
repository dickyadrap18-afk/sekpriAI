# 009 - Implementation Timeline and Task Breakdown

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §10.
> The blueprint refers to this file as `009-timeline-task-breakdown.md`. The
> repo uses the more descriptive name `009-implementation-timeline.md`.

## Phase 0 - Specs and foundation docs (this phase)

**Goal**: Create the source-of-truth project docs before any code lands.

Tasks:
- [x] Convert `sekpriAI_Source_of_Truth_Blueprint.docx` to
      `docs/sekpriAI_Source_of_Truth_Blueprint.md`.
- [x] Create the `specs/` folder with 001-009.
- [x] Write `CLAUDE.md`, `ARCHITECTURE.md`, `WORKFLOW.md`.
- [x] Create role-based agents under `.claude/agents/`.
- [x] Verify all docs are consistent with the blueprint.

**Acceptance**: All docs exist, define scope, architecture, safety rules,
database, provider approach, channels, testing, and implementation order.
No code beyond the docx-to-md conversion script.

## Phase 1 - App foundation

**Goal**: working Next.js shell with Supabase Auth.

Tasks:
- [x] `pnpm create next-app@latest` with TypeScript, App Router, Tailwind.
- [x] Install shadcn/ui and add base primitives.
- [x] Add `lib/supabase/{client,server}.ts`.
- [x] Implement Supabase Auth (email/password) and protected route group.
- [x] Build `AppShell` with responsive sidebar and top bar.
- [x] Add PWA manifest, icons, and a minimal service worker.
- [x] Set up ESLint, Prettier, Husky pre-commit (lint + typecheck).

**Acceptance**: A new user can sign up, log in, and reach a protected
dashboard that renders correctly on desktop and mobile.

## Phase 2 - Database and RLS

**Goal**: schema in place with strict RLS.

Tasks:
- [x] Create `supabase/migrations/` and write migrations per `specs/004-erd.md`.
- [x] Enable `pgvector`.
- [x] Add indexes per `specs/004-erd.md`.
- [x] Add RLS policies for every user-scoped table.
- [x] Create the private `attachments` storage bucket with policies.
- [x] Add a seed script that inserts demo messages for a logged-in user.

**Acceptance**: A second user cannot read the first user's data via the
client SDK, verified by an integration test.

## Phase 3 - Core email UI

**Goal**: end-to-end email client UX (still backed by seed/fixture data).

Tasks:
- [x] Inbox list with virtualization for large counts.
- [x] Account switcher and filters.
- [x] Message detail with attachments rendering.
- [x] Compose sheet (new / reply / forward) with form validation.
- [x] Search with debounced query.
- [x] Labels, archive, delete actions with optimistic UI.
- [x] Empty / loading / error states for every view.

**Acceptance**: A user can browse, open, search, compose, reply, forward,
archive, and delete using fixture data.

## Phase 4 - Provider integration

**Goal**: real Gmail, Office 365, and IMAP connections.

Tasks:
- [x] Define `EmailProviderAdapter` and shared types in `lib/providers/types.ts`.
- [x] Gmail OAuth + Gmail API adapter (sync, send, archive, delete, label).
- [x] Office 365 OAuth + Microsoft Graph adapter.
- [x] IMAP adapter with Yahoo/AOL presets and custom host form.
- [x] SMTP send for IMAP accounts.
- [x] Manual sync endpoint and 1-minute Vercel Cron sync.
- [x] Token encryption via `lib/security/crypto.ts`.
- [x] Reconnect banner when `sync_status = 'auth_required'`.

**Acceptance**: All three provider types can connect and sync into the
unified inbox; send and archive succeed end to end for each.

## Phase 5 - AI core

**Goal**: AI summaries, drafts, priority, and risk.

Tasks:
- [x] `features/ai/clients/*` for Claude (default), OpenAI, Gemini, DeepSeek.
- [x] Prompt modules per `specs/005-ai-agent-spec.md`.
- [x] Sync hook that triggers `summarize`, `priority`, `risk` after upsert.
- [x] AI draft reply endpoint and UI button.
- [x] AI summary card, priority badge, risk badge in message detail.
- [x] `ai_actions` audit logging.

**Acceptance**: New synced messages get AI summary + priority + risk
within a few seconds; draft button produces a reasonable reply.

## Phase 6 - Memory and RAG

**Goal**: memory pipeline with approval gate, RAG over emails and
attachments.

Tasks:
- [x] Memory extraction prompt and background pass per email.
- [x] Memory page with Pending / Active / Rejected tabs.
- [x] Approval, edit, reject, delete flows.
- [x] PDF / TXT / DOCX text extraction in `features/rag/server/extract.ts`.
- [x] Chunker, embedder, and pgvector retrieval.
- [x] Wire RAG context into `draft-reply` and channel commands.

**Acceptance**: Memory items only become active after user approval;
draft prompts include retrieved chunks when relevant.

## Phase 7 - Telegram and WhatsApp mock

**Goal**: command channels live.

Tasks:
- [x] Create Telegram bot, set webhook to `/api/telegram/webhook/<secret>`.
- [x] Binding code generation and `/start <code>` flow.
- [x] Welcome message and command parser.
- [x] High-priority notification dispatch after AI processing.
- [x] WhatsApp mock chat UI and `/api/whatsapp/mock` endpoint.

**Acceptance**: Real Telegram bot binds, sends welcome, executes commands,
and delivers high-priority notifications. WhatsApp mock chat exchanges
work end to end without any real WhatsApp call.

## Phase 8 - Scheduler and approval

**Goal**: scheduled sending with human-in-the-loop safety.

Tasks:
- [x] Approval service in `features/scheduler/server/approval.ts`.
- [x] Approval dialog UI shared by send and memory activation.
- [x] Schedule form in compose.
- [x] Vercel Cron worker `/api/scheduled/send` running every minute.
- [x] Cancel scheduled email flow.

**Acceptance**: Scheduled emails only send when status is `approved` and
`scheduled_for <= now()`. Sensitive categories require careful approval.

## Phase 9 - Testing

**Goal**: automated test coverage matching `specs/008-testing-spec.md`.

Tasks:
- [x] Vitest setup with TS path aliases.
- [x] Testing Library setup for component tests where useful.
- [x] Playwright setup with mobile + desktop projects.
- [x] Unit tests for normalizers, parsers, classifiers, crypto.
- [x] Integration tests for sync, send, memory, scheduler, telegram.
- [x] E2E tests for inbox, compose, AI, memory, channels, scheduler.

**Acceptance**: All gates pass on CI: lint, typecheck, unit, integration,
build, E2E.

## Phase 10 - Deployment and deliverables

**Goal**: live demo on Vercel.

Tasks:
- [x] Create Vercel project linked to the repo.
- [x] Set all env vars from `specs/003-technical-spec.md` §7.
- [x] Configure OAuth redirect URIs (Gmail, Office 365).
- [x] Configure Telegram webhook URL.
- [x] Run full CI gates on the deploy branch.
- [x] Smoke-test on the live URL.
- [x] Finalize README and submission message.

**Acceptance**: Live URL works end to end; all deliverables in
`specs/008-testing-spec.md` §6 manual checklist pass on the live site.

## Cross-phase guardrails

- No phase starts before its specs are read by the implementer.
- Each phase ends with `build-validator` green and `verify-app` checklist
  green for the affected area.
- Each merged PR updates `specs/*` if the spec was wrong, instead of just
  diverging in code.
