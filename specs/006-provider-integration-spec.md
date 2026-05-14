# 006 - Provider Integration Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §6.

## 1. Overview

sekpriAI integrates three email providers behind a single
`EmailProviderAdapter` interface (see `specs/003-technical-spec.md` §4):

- **Gmail** (Google OAuth + Gmail API)
- **Office 365** (Microsoft OAuth + Microsoft Graph)
- **IMAP/SMTP** (Yahoo, AOL, custom hosts)

UI components must never call provider SDKs directly. All provider work goes
through `lib/providers/{gmail,office365,imap}/` and is invoked from
`features/email/server/*` and `app/api/*`.

## 2. Gmail

### Auth flow
- OAuth 2.0 with scopes:
  `https://www.googleapis.com/auth/gmail.modify` plus
  `https://www.googleapis.com/auth/userinfo.email`.
- For the assessment, use Google's OAuth test users. Document this in the
  README before deploying.
- Callback: `app/api/auth/callback/gmail/route.ts`.
- On callback, exchange the code for tokens, encrypt with
  `lib/security/crypto.ts`, and upsert into `email_accounts`.

### Sync
- Use `users.history.list` when `historyId` is known, falling back to
  `users.messages.list` with `q=newer_than:1d` for the first sync.
- Fetch full payloads with `users.messages.get?format=full` and parse MIME
  parts to populate `bodyText`, `bodyHtml`, `attachments`.
- Map labels directly to `messages.labels`.

### Send / archive / delete / label
- Send: `users.messages.send` with a base64url-encoded MIME message.
- Archive: `users.messages.modify` removing `INBOX`.
- Delete: `users.messages.trash`.
- Apply label: `users.messages.modify` adding the label id (look up by
  name; create if missing).

## 3. Office 365

### Auth flow
- Microsoft Identity Platform OAuth 2.0. Scopes:
  `Mail.ReadWrite Mail.Send offline_access User.Read`.
- Multi-tenant (common) endpoint for sign-in.
- Callback: `app/api/auth/callback/office365/route.ts`.

### Sync
- Use Microsoft Graph delta queries:
  `GET /me/mailFolders/Inbox/messages/delta`. Persist the delta link per
  account.
- Map `conversationId` to `provider_thread_id`.
- Categories map to `messages.labels`.

### Send / archive / delete
- Send: `POST /me/sendMail`.
- Archive: move to the Archive folder via `POST /me/messages/{id}/move`.
- Delete: `DELETE /me/messages/{id}` (moves to Deleted Items).
- Apply category: `PATCH /me/messages/{id}` with `categories` array.

## 4. IMAP / SMTP

### Account creation
- The user supplies email, IMAP host/port, SMTP host/port, username,
  password (or app password). The form preselects Yahoo and AOL presets;
  custom IMAP entry is allowed.
- Password stored as `imap_password_encrypted`.

### Library
- IMAP: `imapflow` (TypeScript-friendly, supports modern IMAP servers).
- SMTP: `nodemailer`.
- MIME parsing: `mailparser`.

### Sync
- Connect via TLS, select INBOX, search `UID SINCE <last_synced_at>`.
- For each new UID, fetch headers + body, parse with `mailparser`.
- Derive thread key from `Message-ID`, `In-Reply-To`, and `References`.
- Map IMAP folder name to a single label per message.
- Detect attachments and stream to Supabase Storage; record metadata in
  `attachments`.

### Send / archive / delete
- Send: SMTP with `In-Reply-To` and `References` headers built from the
  parent message.
- Archive: move via IMAP to the configured archive folder
  (`[Gmail]/All Mail` for Gmail-IMAP, `Archive` otherwise).
- Delete: move to Trash folder, fall back to setting `\Deleted` flag and
  `EXPUNGE` if Trash is unavailable.

## 5. Sync strategy (all providers)

- Background sync runs every 60 seconds via Vercel Cron (`POST /api/cron/sync`).
- Sync is incremental:
  - Gmail: `historyId` continuation.
  - Office 365: delta link.
  - IMAP: `last_synced_at` and last seen UID per folder.
- Sync upserts into `messages` keyed by `(account_id, provider_message_id)`.
- After upsert, AI processing is queued for unprocessed messages.
- Failures are recorded in `email_accounts.sync_status`. The UI shows a
  reconnect banner when `sync_status = 'auth_required'`.

## 6. Token refresh

- Gmail and Office 365 refresh tokens are used server-side only.
- Refresh happens lazily before each provider call. On refresh failure with
  `invalid_grant`, mark `sync_status = 'auth_required'` and notify the user.

## 7. Attachment handling

- During sync, attachments are downloaded and uploaded to the
  `attachments` Storage bucket (private) with key
  `attachments/{user_id}/{message_id}/{filename}`.
- Extracted text (PDF, TXT, DOCX) is computed in
  `features/rag/server/extract.ts` and stored in `attachments.extracted_text`.
- Files larger than the configured limit (default 10 MB) are skipped with a
  log entry; metadata is still recorded.

## 8. Rate limits and quotas

- Gmail: per-user 250 quota units/sec, 1B units/day. Avoid `format=full`
  in bulk; use metadata + targeted full fetches.
- Microsoft Graph: throttling with `Retry-After` honored. Use `$select` to
  limit fields and `$top` for page size.
- IMAP: respect server `IDLE` and connection limits; close connections
  after each sync run.

## 9. Test fixtures

- Each provider adapter has unit tests that feed fixture payloads through
  the normalization layer and assert the resulting `NormalizedMessage`.
- Live integration tests run against a dedicated test mailbox per provider
  (gated by env var `RUN_LIVE_PROVIDER_TESTS=1`).

## 10. Open items

- Gmail attachments larger than 25 MB go through the Gmail attachments
  download endpoint - decide later whether to support these or skip.
- Whether to support OAuth-based IMAP (Microsoft IMAP with OAuth) is
  out of scope for the MVP; revisit if Yahoo deprecates app passwords.
