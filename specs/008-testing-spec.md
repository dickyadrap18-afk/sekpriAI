# 008 - Testing Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §11.

## 1. Test pyramid

| Layer       | Tooling                              | Scope                                                |
| ----------- | ------------------------------------ | ---------------------------------------------------- |
| Unit        | Vitest                               | Pure functions, parsers, normalizers, classifiers.   |
| Integration | Vitest + Supabase test schema        | Server modules + DB. Mock external HTTP.             |
| E2E         | Playwright                           | Browser flows against a running dev or preview URL.  |
| Manual demo | Checklist in §6                      | Final verification before deployment.                |

## 2. Unit tests

Required coverage:

- Provider normalization (`lib/providers/{gmail,office365,imap}/normalize.test.ts`)
  - Gmail MIME -> NormalizedMessage
  - Microsoft Graph payload -> NormalizedMessage
  - IMAP fetched payload -> NormalizedMessage with thread key derivation
- AI prompt parsers (`features/ai/prompts/*.test.ts`)
  - Priority parser handles all three values and rejects invalid input.
  - Risk parser handles all three values and `requires_approval` flag.
  - Draft parser preserves quoted history.
  - Memory extractor returns an array (possibly empty), never `null`.
  - Channel intent parser maps natural utterances to `intent_type`.
- RAG chunker (`features/rag/server/chunk.test.ts`)
  - Splits long bodies into bounded chunks with overlap.
  - Skips empty input.
- Crypto helpers (`lib/security/crypto.test.ts`)
  - Round-trip encrypt / decrypt.
  - Tampered ciphertext fails authentication.

## 3. Integration tests

Required coverage:

- Sync pipeline: fixture provider response -> upsert into `messages` ->
  AI processing queued -> rows present.
- Send pipeline: `POST /api/messages/send` with approved payload calls the
  adapter and writes the sent message back to `messages`.
- Send pipeline: same call without approval rejects with HTTP 403 and no
  outbound side effects.
- Memory approval: `POST /api/memory/:id/approve` flips status to
  `active` and the next draft prompt receives the item.
- Telegram webhook: `/start <code>` binds; subsequent commands route
  through the intent parser and produce expected outputs.
- Scheduled send worker: only `status = 'approved'` rows past
  `scheduled_for` are sent and marked `sent`.

External APIs are mocked at the HTTP boundary using `msw` or per-adapter
test doubles. RLS is exercised against a test Supabase schema using a
service role for setup but the user-scoped client for assertions.

## 4. E2E tests

Required coverage (Playwright, against `pnpm dev` or a Vercel preview):

- Auth: sign up, sign in, sign out.
- Onboarding: connect a mocked provider, land on inbox.
- Inbox: list renders, account switcher filters, search returns matches,
  open message shows AI summary card.
- Compose / reply / forward: open, edit, request AI draft, confirm send.
- Memory: open Memory page, approve a pending item, confirm it persists.
- Channels: WhatsApp mock chat exchange shows correct bubble alignment.
- Scheduler: schedule a send, approve, and observe it as sent in fast-
  forwarded test mode.

## 5. CI gates

The CI pipeline runs in this order:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (unit + integration)
4. `pnpm build`
5. `pnpm test:e2e` (against the build)

A failing earlier gate stops the pipeline. The `build-validator` agent
mirrors this order locally.

## 6. Manual demo checklist

Run before any release / submission.

- [ ] Sign up a fresh user.
- [ ] Connect a Gmail account (test user) and confirm sync starts.
- [ ] Connect an IMAP account (e.g., a Yahoo test mailbox).
- [ ] Confirm unified inbox shows messages from both with provider badge.
- [ ] Open a message; confirm AI summary, priority, risk render.
- [ ] Click "AI draft reply"; confirm draft is reasonable.
- [ ] Confirm send dialog gates a sensitive draft (e.g., a pricing email).
- [ ] Approve a pending memory item; confirm it shifts to Active.
- [ ] Bind Telegram via the deep link; confirm welcome message arrives.
- [ ] Trigger a high-priority email; confirm Telegram notification.
- [ ] Send a command in WhatsApp mock; confirm parsed response.
- [ ] Schedule and approve a future send; confirm it sends at fake time
      in the worker.
- [ ] Refresh inbox on mobile viewport; confirm responsive layout.

## 7. Test data and fixtures

- `tests/fixtures/gmail/*.json` - sample Gmail message payloads.
- `tests/fixtures/office365/*.json` - sample Graph payloads.
- `tests/fixtures/imap/*.eml` - raw RFC 5322 messages for IMAP path.
- `tests/fixtures/attachments/*.{pdf,txt,docx}` - attachment extraction.

## 8. Observability in tests

- Tests assert `ai_actions` rows are written for any AI call.
- Tests assert `approval_requests` rows for any send / memory activation.
- Logs are silenced by default and surfaced only on failure.

## 9. Known gaps (acceptable for MVP)

- Live provider tests are gated by `RUN_LIVE_PROVIDER_TESTS=1` and only
  run locally. They are not part of CI.
- Visual regression tests are not in scope for MVP.
- Load and performance tests are not in scope for MVP.
