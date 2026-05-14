# sekpriAI

AI-first universal email client delivered as a mobile-ready PWA.

## Features

- **Unified Inbox** — Gmail, Office 365, Yahoo/AOL/custom IMAP in one view
- **AI Secretary** — Summaries, priority classification, risk assessment, reply drafts
- **AI Memory** — Extract and approve key facts from emails for future context
- **RAG** — Retrieval over email body and PDF/TXT/DOCX attachments
- **Telegram Bot** — Real integration for notifications and natural-language commands
- **WhatsApp Mock** — Simulated chat UI demonstrating future channel expansion
- **Scheduled Sending** — Human-in-the-loop approval before any email sends
- **Mobile-Ready PWA** — Responsive design, installable on mobile devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Vercel Serverless (App Router API routes)
- **Database**: Supabase (Postgres + pgvector + Auth + Storage + RLS)
- **AI**: Claude (default), OpenAI, Gemini, DeepSeek (configurable)
- **Email**: Gmail API, Microsoft Graph, IMAP/SMTP
- **Channels**: Telegram Bot API (real), WhatsApp (mock UI)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (or local via `supabase start`)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd sekpriai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL and keys

# Run database migrations
# (Apply via Supabase dashboard or CLI)

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for the full list. Required for basic functionality:

```
NEXT_PUBLIC_SUPABASE_URL=https://bggzhfujjotofotctspy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For full AI and provider features, also set:
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side operations
- `ENCRYPTION_KEY` — 32-byte hex for token encryption
- `ANTHROPIC_API_KEY` — for Claude AI features
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Gmail OAuth
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` — for Office 365
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` — for Telegram

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Unit + integration tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run format       # Prettier formatting
npm run validate     # lint + typecheck + build
npm run validate:full # validate + E2E tests
```

## Project Structure

```
app/                  # Next.js App Router routes
  (app)/              # Protected routes (inbox, memory, channels, settings)
  api/                # Serverless API routes
components/           # Shared UI components (AppShell)
features/
  email/              # Inbox, message detail, compose
  ai/                 # AI clients, prompts, orchestration
  memory/             # Memory extraction and approval
  rag/                # Chunking, embedding, retrieval
  channels/           # Telegram and WhatsApp mock
  scheduler/          # Scheduled sends and approval
lib/
  supabase/           # Supabase clients and types
  providers/          # Email provider adapters (Gmail, Office 365, IMAP)
  security/           # Token encryption
specs/                # Implementation specs (PRD, design, technical, etc.)
docs/                 # Source-of-truth blueprint
supabase/migrations/  # Database schema
tests/                # E2E tests
```

## Architecture

See `ARCHITECTURE.md` for the full architecture reference.

Key principles:
- Clean architecture boundaries (UI → features → providers)
- Provider adapter pattern (one interface, three implementations)
- AI safety: no email sends without explicit user approval
- RLS on every table (user can only access own data)
- Server-only modules for secrets and provider calls

## Documentation

- `CLAUDE.md` — Operating manual for AI-assisted development
- `ARCHITECTURE.md` — Architecture reference
- `WORKFLOW.md` — Development workflow and agents
- `specs/` — All implementation specs (PRD through timeline)
- `docs/sekpriAI_Source_of_Truth_Blueprint.md` — Master blueprint

## Deployment

Deployed on Vercel. The app uses:
- Vercel Cron for background sync (every 1 minute)
- Vercel Cron for scheduled email sending (every 1 minute)
- Supabase for all data persistence and auth

### OAuth Setup (for Gmail/Office 365)

1. Create OAuth credentials in Google Cloud Console / Azure Portal
2. Set redirect URIs to `https://<your-domain>/api/auth/callback/gmail` and `/office365`
3. Add credentials to Vercel environment variables

### Telegram Setup

1. Create a bot via @BotFather
2. Set webhook: `https://<your-domain>/api/telegram/webhook/<your-secret>`
3. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` to env vars

## Safety Rules

- AI may summarize, draft, classify, and extract memory automatically
- AI may NOT send email without explicit user approval
- AI may NOT activate memory without user approval
- Business/legal/payment emails require careful human approval
- All tokens encrypted at rest (AES-256-GCM)
- RLS enforces data isolation between users

## License

Private project for assessment purposes.
