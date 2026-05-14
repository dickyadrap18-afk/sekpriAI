# Contributing to sekpriAI

Thank you for your interest in contributing to sekpriAI! This guide will help
you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)
- Git

### Setup

```bash
git clone https://github.com/<your-username>/sekpriai.git
cd sekpriai
npm install
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm run dev
```

### Understanding the Project

Before contributing, read these files in order:

1. `CLAUDE.md` — Project rules, boundaries, and development workflow
2. `ARCHITECTURE.md` — System architecture and module boundaries
3. `WORKFLOW.md` — Development methodology, agents, skills, hooks
4. `specs/001-prd.md` — Product requirements and scope
5. The specific spec for the area you want to work on (`specs/*.md`)

## Development Workflow

sekpriAI uses a **specs-driven, read/change/verify** workflow:

### 1. Pick a Task

- Check `specs/009-implementation-timeline.md` for open tasks
- Check GitHub Issues for bugs or feature requests
- If proposing a new feature, open an issue first to discuss scope

### 2. Read the Spec

Every feature area has a spec. Read it before writing code:

- Email: `specs/006-provider-integration-spec.md`
- AI: `specs/005-ai-agent-spec.md`
- Channels: `specs/007-telegram-whatsapp-spec.md`
- Database: `specs/004-erd.md`
- UI: `specs/002-design-spec.md`

### 3. Create a Branch

```bash
git checkout -b feat/<area>-<short-description>
# Examples:
# feat/email-thread-view
# fix/memory-approval-idor
# docs/update-readme
```

### 4. Make Small Changes

- One logical change per commit
- Keep files under 300 lines
- Keep functions under 50 lines
- Follow the existing code style

### 5. Verify

```bash
npm run typecheck    # Must pass
npm run test         # Must pass
npm run build        # Must pass
```

### 6. Open a PR

PR description must include:
- Link to the spec section being implemented
- Files touched
- What was verified (which gates passed)
- Any remaining gaps or known issues

## Architecture Rules (Non-Negotiable)

These will cause your PR to be rejected if violated:

- ❌ UI components importing from `lib/providers/*` or `features/ai/clients/*`
- ❌ Provider-specific fields leaking into the normalized message schema
- ❌ Tokens, API keys, or secrets in `NEXT_PUBLIC_*` env vars
- ❌ Send route bypassing the approval gate
- ❌ Direct Supabase writes from React components (use server actions/routes)
- ❌ New features without a spec entry

## Folder Structure

```
app/              → Next.js routes (pages + API)
components/       → Shared UI primitives
features/
  email/          → Inbox, compose, message detail
  ai/             → AI clients, prompts, orchestration
  memory/         → Memory extraction and approval
  rag/            → Chunking, embedding, retrieval
  channels/       → Telegram + WhatsApp mock
  scheduler/      → Scheduled sends
lib/
  supabase/       → DB clients and types
  providers/      → Email provider adapters
  security/       → Encryption, auth helpers
```

## Code Style

- TypeScript strict mode (no `as any`)
- Use `zod` for request validation in API routes
- Use `import "server-only"` in server modules
- Prefer named exports over default exports
- Use descriptive variable names
- Add comments only for architectural decisions, not obvious code

## Testing

- Unit tests: `*.test.ts` next to the source file
- E2E tests: `tests/e2e/*.spec.ts`
- Run with: `npm run test` (unit) or `npm run test:e2e` (E2E)
- Every bug fix should include a regression test

## AI Agent System

sekpriAI uses Claude Code agents for development:

- **code-architect** — Reviews boundaries and schema changes
- **build-validator** — Runs quality gates
- **verify-app** — Checks user flows
- **email-guide** — Reviews mail behavior
- **code-simplifier** — Reduces complexity after features land

See `.claude/agents/` for full agent definitions.

## Skills

Reusable workflow templates in `.claude/skills/`:

- `email-provider-adapter` — Scaffold a new provider
- `ai-email-secretary` — Scaffold a new AI prompt
- `test-generation` — Generate test files
- `pwa-ui` — Scaffold a new UI module

## Reporting Issues

- Use GitHub Issues
- Include: steps to reproduce, expected vs actual behavior, browser/OS
- For security issues, email the maintainers directly (do not open a public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
