# sekpriAI

[![CI](https://github.com/<username>/sekpriai/actions/workflows/ci.yml/badge.svg)](https://github.com/<username>/sekpriai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**AI-first universal email client** delivered as a mobile-ready PWA. Connect Gmail, Office 365, and IMAP providers into one unified inbox with an AI secretary that summarizes, prioritizes, drafts replies, and manages your email through Telegram.

---

## Features

### Email Client
- **Unified Inbox** — Gmail, Office 365, Yahoo/AOL/custom IMAP in one view
- **Full Actions** — Compose, reply, forward, search, labels, archive, delete
- **Account Switching** — Filter by provider or see everything together
- **Responsive PWA** — Works on desktop, tablet, and mobile; installable

### AI Secretary
- **Smart Summaries** — One-sentence summary of every email
- **Priority Classification** — High/medium/low with reasoning
- **Risk Assessment** — Flags sensitive emails requiring careful approval
- **Reply Drafts** — AI-generated replies using email context and memory
- **Memory Extraction** — Learns key facts from emails (with your approval)
- **RAG Retrieval** — Searches email body and PDF/TXT/DOCX attachments for context

### Channels
- **Telegram Bot** — Real integration for notifications and natural-language commands
- **WhatsApp Mock** — Simulated chat UI demonstrating future channel expansion

### Safety
- **Human-in-the-Loop** — AI never sends email without explicit user approval
- **Risk Gates** — Business, legal, payment emails require careful confirmation
- **Memory Approval** — Extracted facts stay pending until you activate them
- **Encrypted Tokens** — All OAuth tokens encrypted at rest (AES-256-GCM)
- **Row Level Security** — Users can only access their own data

---

## AI Agent System

sekpriAI is built using a **specs-driven, agent-assisted workflow** with Claude Code:

### Agents (`.claude/agents/`)
Role-based reviewers and implementation specialists:
- `code-architect` — Guards module boundaries and schema
- `build-validator` — Runs lint, typecheck, test, build gates
- `verify-app` — Sanity-checks user flows and edge cases
- `email-guide` — Reviews mail behavior and threading
- `ai-agent` — Implements AI prompts and RAG
- `frontend-agent` — Builds UI components
- `testing-agent` — Writes and maintains tests
- Plus 6 more specialized agents

### Skills (`.claude/skills/`)
22 reusable workflow templates including:
- `email-provider-adapter` — Scaffold a new email provider
- `ai-email-secretary` — Generate a new AI prompt module
- `test-driven-development` — TDD red-green-refactor cycle
- `subagent-driven-development` — Dispatch parallel agents
- `verification-before-completion` — Evidence before claims

### Hooks (`.claude/hooks/`)
7 automated quality gates:
- Format, lint, typecheck on file save
- Architecture boundary enforcement on writes
- Spec reading before task execution
- Test running after task completion
- Full build validation on agent stop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS |
| UI Components | shadcn/ui, Lucide icons |
| Backend | Vercel Serverless (App Router API routes) |
| Database | Supabase Postgres + pgvector + RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage (encrypted attachments) |
| AI | Claude (default), OpenAI, Gemini, DeepSeek |
| Email | Gmail API, Microsoft Graph, IMAP/SMTP |
| Channels | Telegram Bot API, WhatsApp (mock) |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |

---

## Quick Start

```bash
# Clone
git clone https://github.com/<username>/sekpriai.git
cd sekpriai

# Install
npm install

# Configure
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See `.env.example` for the full list. Minimum for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=<32-byte-hex>
```

For full functionality, also configure:
- `ANTHROPIC_API_KEY` — AI features
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Gmail OAuth
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` — Office 365
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` — Telegram bot
- `CRON_SECRET` — Protects cron endpoints

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript strict check
npm run test         # Unit + integration tests
npm run test:e2e     # E2E tests (Playwright)
npm run format       # Prettier
npm run validate     # lint + typecheck + build
```

---

## Project Structure

```
app/                  # Next.js App Router (pages + API routes)
components/           # Shared UI (AppShell, Toast)
features/
  email/              # Inbox, compose, message detail
  ai/                 # AI clients, prompts, orchestration
  memory/             # Memory extraction and approval
  rag/                # Chunking, embedding, retrieval
  channels/           # Telegram bot + WhatsApp mock
  scheduler/          # Scheduled sends + approval
lib/
  supabase/           # DB clients, types, service client
  providers/          # Email adapters (Gmail, Office 365, IMAP)
  security/           # Encryption, cron auth
specs/                # Implementation specs (9 documents)
docs/                 # Blueprint, audit report, readiness report
supabase/migrations/  # Database schema (11 files)
tests/                # E2E tests
.claude/              # Agents, skills, hooks, plugins
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Operating manual for AI-assisted development |
| `ARCHITECTURE.md` | System architecture and boundaries |
| `WORKFLOW.md` | Development methodology and agents |
| `CONTRIBUTING.md` | How to contribute |
| `specs/` | All implementation specs (PRD → timeline) |
| `docs/audit-report.md` | Security and quality audit findings |
| `docs/production-readiness-report.md` | Deployment readiness assessment |

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before
submitting a PR.

Key points:
- Read the spec for the area you're working on
- Follow the read/change/verify workflow
- Keep changes small and focused
- All quality gates must pass before merge

---

## Security

- Report security vulnerabilities privately (do not open public issues)
- See `docs/audit-report.md` for the latest security assessment
- All tokens encrypted at rest with AES-256-GCM
- Row Level Security on every user-scoped table
- Cron endpoints protected by secret
- HTML email content sanitized with DOMPurify

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

## Acknowledgments

Built with the [superpowers](https://github.com/anthropics/skills) workflow methodology and Claude Code agent system.
