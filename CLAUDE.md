# CLAUDE.md - sekpriAI Operating Manual

This file is the operating manual for any Claude Code session working in
this repository. Read it before editing anything.

## Source-of-truth hierarchy

If documents disagree, resolve in this order:

1. `docs/sekpriAI_Source_of_Truth_Blueprint.md` (master blueprint)
2. `specs/*` (PRD, design, technical, ERD, AI, providers, channels, testing,
   timeline)
3. `ARCHITECTURE.md`
4. `WORKFLOW.md`
5. `CLAUDE.md` (this file)

If something downstream contradicts the blueprint, fix the downstream file.
If the blueprint itself is wrong, update it first and propagate.

## Project overview

sekpriAI is an AI-first universal email client delivered as a mobile-ready
PWA. It connects real Gmail, Office 365, and IMAP providers (Yahoo, AOL,
custom) into one unified inbox and adds an AI secretary that summarizes,
prioritizes, drafts replies, classifies risk, extracts memory, retrieves
context via RAG, sends notifications through Telegram, and supports a full
mock WhatsApp command flow.

See `specs/001-prd.md` for goals, non-goals, and success criteria.

## Non-goals (binding)

The MVP **does not** include any of the following. Reject PRs that add
them unless the PRD has been updated first.

- Calendar
- Contacts manager
- Tasks
- Notes
- CRM
- Real WhatsApp Business API integration
- Autonomous high-risk email sending
- Enterprise-grade production sync (queues, multi-region, SLAs)

## Tech stack (binding)

- TypeScript only. No Python in the runtime app.
- Next.js (App Router), React, TailwindCSS, shadcn/ui.
- Supabase Auth, Postgres, Storage, pgvector.
- Vercel serverless deployment.
- AI providers: Claude default; OpenAI, Gemini, DeepSeek configurable.
- Email providers: Gmail API, Microsoft Graph, IMAP/SMTP.
- Channels: Telegram Bot API (real); WhatsApp mock UI (no API).

## Development rules

- Read the spec for the area you are touching before editing code.
- Make small, iterative changes. No large one-shot implementations.
- Use the read / change / verify loop on every change.
- Keep files small. If a file passes ~300 lines or a function ~50 lines,
  consider splitting before adding more.
- Match the project's existing style and library choices. Do not introduce
  a new state manager, ORM, or UI library without architect review.
- Use server-only modules (`import 'server-only'`) for anything that
  touches secrets, providers, or AI clients.
- Use `zod` for request body validation in route handlers.

## Clean architecture rules

- UI components must not import provider SDKs (Gmail, Microsoft Graph,
  IMAP, Telegram) or LLM clients directly. They go through
  `features/*/server/*` and React hooks.
- Provider integrations live behind the `EmailProviderAdapter` interface
  in `lib/providers/types.ts`. Adapters live under `lib/providers/{gmail,
  office365,imap}/`.
- AI logic lives in `features/ai/*`. Prompts in
  `features/ai/prompts/*.ts`. Provider clients in
  `features/ai/clients/*.ts`.
- Database access is funneled through repository / service modules under
  `lib/supabase/*` and `features/*/server/*`.
- Telegram and WhatsApp command handling lives in `features/channels/*`,
  isolated from email provider logic.
- Tests live next to the code (`*.test.ts`) for unit / integration and in
  `tests/` for cross-feature E2E.
- See `ARCHITECTURE.md` for the full module map.

## Provider adapter contract

```ts
export interface EmailProviderAdapter {
  provider: 'gmail' | 'office365' | 'imap';
  syncMessages(params: { accountId: string; since?: Date }): Promise<NormalizedMessage[]>;
  sendMessage(params: SendMessageInput): Promise<SendMessageResult>;
  archiveMessage(providerMessageId: string): Promise<void>;
  deleteMessage(providerMessageId: string): Promise<void>;
  applyLabel(providerMessageId: string, label: string): Promise<void>;
}
```

Full types in `specs/003-technical-spec.md` §4. Any new provider must
implement this interface and pass the normalization test suite.

## AI safety rules (binding)

- AI may summarize automatically.
- AI may draft replies automatically.
- AI may classify priority automatically.
- AI may classify risk automatically.
- AI may extract memory candidates automatically (status `pending`).
- AI may **not** activate a memory item without explicit user approval.
- AI may **not** send any email without explicit user approval.
- Emails involving business decisions, payment, legal, contracts,
  pricing, client approval, confidential data, or complaints require
  careful human approval. The risk classifier flags these. The send
  route refuses to send when `requires_approval = true` and there is no
  approval row.

## Testing commands

The exact scripts are defined in `package.json`. Default invocations:

```
pnpm install
pnpm lint
pnpm typecheck
pnpm test         # unit + integration (Vitest)
pnpm test:e2e     # Playwright E2E
pnpm build        # Next.js production build
pnpm dev          # local dev (run manually, do not auto-start in agents)
```

If `pnpm` is not available, fall back to `npm run`.

## Definition of done

A change is done when:
- Spec exists and was read by the implementer.
- Code respects clean architecture boundaries (see above).
- `lint`, `typecheck`, unit, integration, and `build` are green.
- For UI changes, `test:e2e` is green for the affected flow.
- `verify-app` checklist for the affected area has been exercised.
- README or relevant doc snippet is updated if env vars or commands
  changed.
- Any safety-sensitive code (auth, RLS, send, scheduler, approval,
  Telegram webhook) has been reviewed by `code-architect`.

## Verification workflow

1. Read the spec for the area.
2. Plan the smallest change that delivers the acceptance criterion.
3. Make the change in one focused commit.
4. Hooks auto-run: format, lint, typecheck on save.
5. Run `build-validator` (lint, typecheck, test, build, e2e where
   relevant).
6. Run `verify-app` checklist for the area.
7. If any step fails, fix the cause - do not silence the failure.
8. Update specs / README if reality drifted from the doc.

## Claude Code workflow structure

This project uses the full `.claude/` workflow:

- **Agents** (`.claude/agents/*.md`): role-based reviewers and validators.
- **Skills** (`.claude/skills/*/SKILL.md`): reusable code generators.
- **Hooks** (`.claude/hooks/*.json`): automated quality gates on events.

See `WORKFLOW.md` for the complete list and usage instructions.

## Contributor expectations

- One feature module owner at a time per module to keep boundaries clean.
- Open a PR per phase task. Keep diffs small and reviewable.
- PR description: link the spec section, list the files touched, list
  what was verified.
- Push to a feature branch. Never push directly to `main`.
- Use the role-based agents in `.claude/agents/*` for review:
  - `code-architect` for boundaries and schema.
  - `email-guide` for mail behavior.
  - `build-validator` for gates.
  - `code-simplifier` after a feature lands.
  - `verify-app` before declaring done.
- Use skills in `.claude/skills/*` for generating new modules:
  - `email-provider-adapter` for new provider adapters.
  - `ai-email-secretary` for new AI prompt modules.
  - `rag-memory` for RAG pipeline code.
  - `telegram-command` for new channel commands.
  - `pwa-ui` for new feature UI modules.
  - `test-generation` for test scaffolds.
  - `vercel-release` for deploy validation.

## Spec naming reconciliation

The blueprint references two specs by older names:

- `007-channels-spec.md` -> repo file `specs/007-telegram-whatsapp-spec.md`
- `009-timeline-task-breakdown.md` -> repo file
  `specs/009-implementation-timeline.md`

The repo names are the active ones. The blueprint will be updated to match
on its next revision.

## What not to do

- Do not start feature implementation before the relevant spec exists.
- Do not introduce Python anywhere in the runtime app.
- Do not call provider SDKs or LLM clients from React components.
- Do not store tokens or API keys in `NEXT_PUBLIC_*` env vars.
- Do not bypass `requires_approval` for any send.
- Do not add features outside `specs/001-prd.md` without updating the PRD.
