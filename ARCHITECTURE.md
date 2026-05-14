# ARCHITECTURE.md - sekpriAI

One-page architecture reference. Read with `specs/003-technical-spec.md`,
`specs/004-erd.md`, `specs/006-provider-integration-spec.md`,
`specs/007-telegram-whatsapp-spec.md`.

## 1. High-level diagram

```
+-----------------------------------------------------------------------+
|                      Mobile-ready PWA (Next.js)                        |
|   features/email   features/ai   features/memory   features/channels  |
|   features/rag     features/scheduler                                  |
+----------------------+----------------------+--------------------------+
                       |                      |
                       v                      v
+----------------------+----------------------+--------------------------+
|        Vercel serverless API routes (app/api/*)                        |
|  auth callbacks  | sync  | send  | ai  | memory  | rag  | telegram     |
|  whatsapp-mock   | scheduler                                           |
+----------------------+----------------------+--------------------------+
                       |                      |
        +--------------+----+      +----------+--------------+
        |                   |      |                          |
        v                   v      v                          v
   Supabase             External email APIs           AI providers
  (Auth, Postgres,    (Gmail, MS Graph,          (Claude default;
   Storage,            IMAP/SMTP)                  OpenAI, Gemini,
   pgvector, RLS)                                  DeepSeek optional)
                                                          |
                                                          v
                                                  Telegram Bot API
                                                  (real integration)

   WhatsApp: full mock UI inside the app. No external API call.
```

## 2. Folder structure (mandatory)

```
app/                    # Next.js App Router routes
  (marketing)/
  (app)/                # protected app shell
  api/                  # serverless route handlers

components/             # cross-cutting UI primitives (AppShell, shadcn wrappers)

features/
  email/
    components/         # inbox, message detail, compose UI
    server/             # server-only mail use cases
    hooks/
    types.ts
  ai/
    prompts/            # one file per prompt (summary, priority, ...)
    clients/            # claude.ts, openai.ts, gemini.ts, deepseek.ts
    server/             # orchestration that wires prompts to UI/api
  memory/
  rag/
  channels/
    telegram/
    whatsapp/
  scheduler/

lib/
  supabase/             # browser client, server client, repositories
  providers/            # email provider adapters (gmail, office365, imap)
    types.ts            # EmailProviderAdapter contract
  security/             # token encryption, secret loading
  utils/

specs/
docs/
tests/                  # cross-feature E2E and integration suites
```

## 3. Clean architecture boundaries

- **UI layer** (`components/*`, `features/*/components/*`,
  `features/*/hooks/*`) talks only to its own feature's `server/*` and to
  `components/*`. It must not import provider SDKs or AI clients.
- **Feature server layer** (`features/*/server/*`) orchestrates a use
  case. It composes provider adapters, AI clients, and Supabase
  repositories. It is the only layer that handles approval gates.
- **Provider layer** (`lib/providers/*`) is the only place allowed to
  call Gmail, Microsoft Graph, IMAP, or SMTP. Each adapter implements
  `EmailProviderAdapter` from `lib/providers/types.ts`.
- **AI client layer** (`features/ai/clients/*`) is the only place allowed
  to call LLM HTTP APIs. The default client is selected via
  `AI_PROVIDER`.
- **Persistence layer** (`lib/supabase/*`, `features/*/server/repositories.ts`)
  is the only place allowed to issue DB queries. It enforces RLS by using
  the user-scoped Supabase client. The service-role client is reserved
  for trusted server jobs (cron, webhook validation) and is never exposed
  to the browser.
- **Channels layer** (`features/channels/*`) parses and executes commands
  from Telegram and WhatsApp mock. It calls feature server layers, never
  provider adapters or AI clients directly.

## 4. Data flow examples

### Inbox open
```
User opens Inbox
  -> features/email/components/InboxPage
     -> useInboxQuery (hook)
        -> GET via Supabase client (RLS filters by user_id)
  -> renders MessageList
```

### Sync (background)
```
Vercel Cron (1 min)
  -> POST /api/cron/sync
     -> features/email/server/sync.runForAllAccounts
        -> for each account:
             lib/providers/<p>/createAdapter(account).syncMessages()
             -> upsert NormalizedMessage[] into messages
             -> queue features/ai/server/processBatch()
                -> features/ai/prompts/summarize/priority/risk
                -> write back to messages.ai_*
                -> if priority == 'high', features/channels/telegram/notify()
```

### Send
```
User clicks Send in ComposeSheet
  -> POST /api/messages/send (zod validated)
     -> features/email/server/send.execute({ payload, approvalToken })
        -> features/scheduler/server/approval.assertApproved()
        -> lib/providers/<p>/createAdapter(account).sendMessage()
        -> upsert sent message into messages
        -> write ai_actions audit row
```

### Telegram command
```
Telegram update -> POST /api/telegram/webhook/<secret>
  -> features/channels/telegram/webhook.handle(update)
     -> features/channels/intent.parse() (uses features/ai)
        -> dispatch to features/email/server/* or features/scheduler/*
        -> reply via Telegram Bot API
```

## 5. Provider adapter pattern

A single interface keeps the rest of the app provider-agnostic:

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

A factory `createXAdapter(account: EmailAccount)` lives in each provider
folder. `features/email/server/*` resolves the right adapter per account
and never branches on provider beyond that.

## 6. AI orchestration

- One prompt module per capability (`summarize`, `priority`, `risk`,
  `draft-reply`, `extract-memory`, `parse-channel-intent`).
- Each module exports a typed function `(input) => Promise<output>` that
  loads the system prompt, the user prompt template, and a JSON schema.
- The orchestrator (`features/ai/server/orchestrate.ts`) decides which
  prompts run for a given trigger (sync, open, draft, channel command).
- Every AI call writes an `ai_actions` row.

## 7. RAG and memory flow

- After sync, attachments are downloaded to Storage and passed to
  `features/rag/server/extract.ts` (PDF / TXT / DOCX text extraction).
- `features/rag/server/chunk.ts` produces bounded overlapping chunks.
- `features/rag/server/embed.ts` calls the AI client's `embed()` and
  inserts rows into `rag_chunks`.
- For draft and channel intents, `features/rag/server/retrieve.ts` runs
  a cosine similarity query, top-k = 6.
- Memory items extracted by AI go to `memory_items` with status
  `pending`. Activation requires a row in `approval_requests` with
  `kind = 'memory_activate'` and `status = 'approved'`.

## 8. Channels architecture

- Telegram bot has a single webhook
  `POST /api/telegram/webhook/<secret>` that authenticates by the secret
  path segment and looks up `telegram_bindings`.
- Both Telegram and WhatsApp mock route through the same intent parser
  and the same command executors. The only difference is the transport.
- The WhatsApp mock UI is a chat panel inside the app. It posts to
  `POST /api/whatsapp/mock` with the user's authenticated session.

## 9. Security boundaries

- All secrets in env vars or encrypted DB columns (AES-256-GCM via
  `lib/security/crypto.ts`).
- RLS on every user-scoped table.
- Service-role Supabase client used only on the server, never exposed to
  the browser bundle.
- Server-only modules use `import 'server-only'`.
- `zod` validates every state-changing request body.
- Webhook URLs include a secret path segment.

## 9a. Email Deliverability

Deliverability is treated as a security and trust concern, not just a
UX concern. AI-generated emails that land in spam damage user trust and
can get the sender's account flagged or suspended.

**Module**: `lib/email/deliverability.ts` — imported only by provider
adapters, never by UI or feature layers.

**Four enforcement layers applied before every send:**

1. **Content scan** — blocks emails containing spam trigger phrases
   (marketing language, pharmaceutical keywords, lottery phrases).
   Warns on ALL CAPS, excessive punctuation, too many URLs.

2. **Content sanitization** — strips AI writing artifacts: excessive
   punctuation, zero-width characters, repeated whitespace, ALL CAPS
   words longer than 8 characters.

3. **RFC-compliant headers** — every outbound email includes:
   `Message-ID`, `Date`, `MIME-Version`, `X-Priority: 3` (Normal),
   `X-Mailer: sekpriAI/1.0`, `Auto-Submitted`, `Precedence: normal`,
   and `X-AI-Generated: assisted` when AI drafted the content.

4. **Rate limiting** — max 30 emails/hour per account (in-process).
   Prevents volume spikes that trigger spam filters.

**Plain text requirement**: every outbound email includes a `text/plain`
part. HTML-only emails score higher on SpamAssassin and are rejected by
many corporate mail servers.

**AI prompt constraints**: `draft-reply` and `compose` prompts explicitly
instruct the model to avoid spam trigger words, generic filler phrases,
and formulaic sentence structure.

See `specs/006-provider-integration-spec.md §11` for the full
deliverability specification.

## 10. Scalability considerations

The MVP runs on Vercel free tier and Supabase free tier. The architecture
intentionally avoids enterprise infrastructure but keeps room to scale:

- Provider adapters are stateless and substitutable; the sync runner can
  be extracted to a queue (e.g., Inngest, Trigger.dev) without changing
  callers.
- AI prompts are pure modules; per-feature provider overrides via env
  let us route heavy workloads to cheaper or faster models.
- pgvector handles the MVP volumes; if it outgrows Postgres we can swap
  the retrieval module without touching prompts.
- Telegram and WhatsApp mock share the same command pipeline, so adding
  a real WhatsApp Business channel later means swapping the transport
  in `features/channels/whatsapp/*`.

## 11. Feature module ownership

Each feature module under `features/*` has one declared owner per phase.
Owners are listed in PR descriptions and tracked informally. External
contributors should pick a feature module and stay within its boundary,
escalating to `code-architect` when crossing into `lib/providers/*` or
shared schema.

## 12. Decision log

ADRs live under `docs/adr/`. Add a new file when:

- Introducing a new dependency.
- Changing a module boundary.
- Changing the schema in a non-additive way.
- Replacing an AI client behavior in a way users will notice.

ADR template: context, decision, consequences, alternatives considered.
