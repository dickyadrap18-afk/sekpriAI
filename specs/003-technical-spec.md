# 003 - Technical Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §4.

## 1. Stack

- **Language**: TypeScript only. No Python in the runtime app.
- **Framework**: Next.js (App Router) on Vercel serverless.
- **UI**: React + TailwindCSS + shadcn/ui.
- **Auth**: Supabase Auth.
- **Database**: Supabase Postgres with Row Level Security.
- **Storage**: Supabase Storage for attachments.
- **Vector**: Supabase pgvector (1536-dimension embeddings).
- **Deployment**: Vercel free tier.
- **AI providers**: Claude default; OpenAI, Gemini, DeepSeek configurable
  via env.
- **Email providers**: Gmail API, Microsoft Graph, IMAP/SMTP.
- **Channels**: Telegram Bot API (real); WhatsApp mock UI (no API).

## 2. Folder structure (mandatory)

The repo uses a feature-module layout. Top-level folders:

```
app/                   # Next.js routes (App Router) and server entrypoints
  (marketing)/
  (app)/               # protected routes
  api/                 # serverless route handlers

components/            # cross-cutting UI primitives that don't belong to a
                       # single feature (shadcn wrappers, AppShell, etc.)

features/
  email/               # inbox, message detail, compose, reply, forward,
                       # search, labels, archive, delete
    components/
    server/            # server-only helpers (route handlers call into here)
    hooks/
    types.ts
  ai/                  # prompts, summary, priority, risk, draft, intent
    prompts/
    server/
    clients/           # Claude, OpenAI, Gemini, DeepSeek wrappers
  memory/              # memory extraction, approval, listing
  rag/                 # chunking, embeddings, retrieval
  channels/            # Telegram and WhatsApp-mock command handling
    telegram/
    whatsapp/
  scheduler/           # scheduled sends + approval gate

lib/
  supabase/            # browser and server clients, repositories, RLS helpers
  providers/           # email provider adapters (gmail, office365, imap)
    types.ts           # EmailProviderAdapter contract
    gmail/
    office365/
    imap/
  security/            # token encryption, secret loading, header builders
  utils/               # small generic helpers used in 2+ places

specs/                 # all specs (this folder)
docs/                  # source-of-truth blueprint, ADRs
tests/                 # cross-feature E2E and integration suites
```

Rules:
- UI components must not import from `lib/providers/*` or AI clients
  directly. They go through `features/*/server/*` and React hooks.
- `features/*/components/*` may import from `components/*` and the same
  feature's `server/*` and `hooks/*`. They must not import another feature's
  internals.
- `lib/providers/*` is the only module allowed to talk to Gmail, Microsoft
  Graph, IMAP, or SMTP.
- `features/ai/clients/*` is the only module allowed to talk to LLM
  providers.

## 3. API surface (serverless routes)

Routes live under `app/api`. Naming and purpose:

| Route                               | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `POST /api/auth/callback/gmail`     | Gmail OAuth callback.                                  |
| `POST /api/auth/callback/office365` | Office 365 OAuth callback.                             |
| `POST /api/accounts/imap`           | Save IMAP account credentials (encrypted).             |
| `POST /api/sync/run`                | Manual sync trigger for one or all accounts.           |
| `POST /api/cron/sync`               | Vercel Cron entry: 1-minute background sync.           |
| `POST /api/messages/:id/archive`    | Archive a message.                                     |
| `POST /api/messages/:id/delete`     | Delete (move-to-trash) a message.                      |
| `POST /api/messages/send`           | Send a message after approval.                         |
| `POST /api/messages/draft`          | Generate AI reply draft.                               |
| `POST /api/ai/summarize`            | Summary on demand.                                     |
| `POST /api/ai/classify`             | Priority and risk classification.                      |
| `POST /api/memory/extract`          | Extract pending memory candidates from a message.      |
| `POST /api/memory/:id/approve`      | Activate a pending memory item.                        |
| `POST /api/rag/index`               | Index a message or attachment into pgvector.           |
| `POST /api/rag/query`               | Retrieve context for a draft or command.               |
| `POST /api/telegram/webhook`        | Telegram bot webhook.                                  |
| `POST /api/whatsapp/mock`           | WhatsApp mock command endpoint.                        |
| `POST /api/scheduled/send`          | Worker that flushes due, approved scheduled emails.    |

## 4. Provider adapter contract

```ts
// lib/providers/types.ts
export type Provider = 'gmail' | 'office365' | 'imap';

export interface NormalizedMessage {
  providerMessageId: string;
  providerThreadId?: string;
  fromName?: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  receivedAt: Date;
  labels: string[];
  attachments: NormalizedAttachment[];
}

export interface NormalizedAttachment {
  providerAttachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string; // populated after we copy to Supabase Storage
}

export interface SendMessageInput {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  inReplyToMessageId?: string;
  references?: string[];
  attachments?: { filename: string; mimeType: string; storagePath: string }[];
  isAiGenerated?: boolean;  // When true: adds X-AI-Generated header and applies stricter content checks
}

export interface SendMessageResult {
  providerMessageId: string;
  providerThreadId?: string;
}

export interface EmailProviderAdapter {
  provider: Provider;
  syncMessages(params: {
    accountId: string;
    since?: Date;
  }): Promise<NormalizedMessage[]>;
  sendMessage(params: SendMessageInput): Promise<SendMessageResult>;
  archiveMessage(providerMessageId: string): Promise<void>;
  deleteMessage(providerMessageId: string): Promise<void>;
  applyLabel(providerMessageId: string, label: string): Promise<void>;
}
```

Implementations live under `lib/providers/{gmail,office365,imap}/`. Each
exports a factory `createXAdapter(account: EmailAccount): EmailProviderAdapter`.

## 5. AI provider contract

```ts
// features/ai/clients/types.ts
export type AIProvider = 'claude' | 'openai' | 'gemini' | 'deepseek';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  jsonSchema?: object;        // when set, response must conform
  temperature?: number;
}

export interface AIChatResponse {
  text: string;
  json?: unknown;
}

export interface AIClient {
  provider: AIProvider;
  chat(req: AIChatRequest): Promise<AIChatResponse>;
  embed(input: string | string[]): Promise<number[][]>;
}
```

The default client is selected via `AI_PROVIDER` env var with `claude` as
default. Each prompt module imports `getAIClient()` rather than constructing
clients directly.

## 6. Security boundaries

- **Secrets**: All OAuth client secrets, API keys, and bot tokens live in
  Vercel env vars or encrypted DB columns. Never in `NEXT_PUBLIC_*`.
- **Token storage**: `email_accounts.access_token_encrypted`,
  `refresh_token_encrypted`, and `imap_password_encrypted` use AES-256-GCM
  with a key from `ENCRYPTION_KEY` env var. Encryption helpers live in
  `lib/security/crypto.ts`.
- **RLS**: every table with `user_id` has a policy that enforces
  `user_id = auth.uid()` for select / insert / update / delete.
- **Server-only modules**: any file under `*/server/*` must be marked
  `import 'server-only'` to keep it out of the client bundle.
- **CSRF**: state-changing routes require an authenticated Supabase session
  cookie. Telegram webhook is authenticated by a secret path token.
- **Input validation**: route handlers use `zod` schemas for request bodies.
- **Email deliverability**: `lib/email/deliverability.ts` enforces content
  scanning, sanitization, RFC-compliant headers, and rate limiting on every
  outbound email. This is mandatory for AI-generated sends to prevent spam
  classification and sender account suspension. See
  `specs/006-provider-integration-spec.md §11` for the full specification.

## 7. Environment variables

```
# Public (browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=

# Server (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=                 # 32-byte hex
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
AI_PROVIDER=claude
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

`.env.example` mirrors this list with empty values.

## 8. Background jobs

- **1-minute sync**: Vercel Cron hits `POST /api/cron/sync`. The handler
  iterates over accounts that need refresh and dispatches per-account sync.
  Each sync run has a hard wall-clock budget (e.g., 25s) to stay within
  serverless limits.
- **AI processing**: triggered after sync upserts, batched per account.
  Skips messages already processed (`ai_processed_at IS NOT NULL`).
- **Scheduled send**: `POST /api/scheduled/send` runs every 1 minute via
  Vercel Cron, sends due-and-approved entries, marks them sent.

## 9. Observability

- Structured server logs (`pino`) with `requestId`, `userId`, `feature`.
- AI calls log prompt id, model, token counts (no PII bodies).
- Errors surface a `correlationId` to the UI for support.

## 10. Performance budgets

- Inbox list initial render: < 1.5s on cached data.
- Message detail open: < 300ms when AI summary is cached.
- AI summary generation: target < 3s P50 with Claude Sonnet-class model.
- Sync run for one account: < 25s wall clock.

## 11. Definition of done

A feature is done when:
- Spec exists and has been read by the implementer.
- Code matches the folder boundaries above.
- `lint`, `typecheck`, unit tests, integration tests, build, and (for UI
  changes) E2E pass.
- `verify-app` checklist for the affected area is green.
- README or relevant doc snippet updated if the env vars or commands changed.
