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

## 11. Email Deliverability

Email deliverability is a first-class concern for sekpriAI, especially
because the AI agent can compose and send emails autonomously. Poor
deliverability damages the sender's domain reputation and erodes user trust.

### 11.1 Deliverability module

All deliverability logic lives in `lib/email/deliverability.ts`. It is
imported exclusively by provider adapters — never by UI or feature layers.

The module provides four capabilities:

| Function | Purpose |
|----------|---------|
| `checkDeliverability(subject, body)` | Scans content for spam signals. Returns a score (0–100) and a list of warnings. Blocks sends that exceed the threshold. |
| `sanitizeEmailContent(text)` | Strips AI writing artifacts: excessive punctuation, ALL CAPS, zero-width characters, repeated whitespace. |
| `buildDeliverabilityHeaders(params)` | Returns a complete set of RFC-compliant SMTP headers that improve trust scores across Gmail, Outlook, Yahoo, and SpamAssassin. |
| `generateMessageId(fromEmail)` | Produces a properly formatted `Message-ID` in `<timestamp.random@domain>` format. |
| `checkRateLimit(accountId, limitPerHour)` | In-process rate limiter. Default: 30 emails/hour per account. Prevents volume spikes that trigger spam filters. |

### 11.2 Content rules (enforced before every send)

The following patterns cause a **hard block** (send is rejected):

- Spam trigger phrases: "click here", "act now", "limited time", "free money",
  "guaranteed", "no obligation", "risk free"
- Lottery/prize phrases: "you've been selected", "claim your prize"
- Pharmaceutical keywords: "viagra", "pharmacy", "prescription"
- Financial spam: "bitcoin", "investment opportunity", "passive income"

The following patterns produce a **warning** (send proceeds, logged):

- Excessive ALL CAPS (≥10 consecutive uppercase characters)
- Three or more consecutive exclamation marks (`!!!`)
- Multiple dollar signs (`$$`)
- More than five URLs in the body
- Subject line longer than 78 characters
- Body shorter than 5 words

### 11.3 SMTP headers sent on every outbound message

```
Message-ID:              <timestamp.random@sender-domain>   (RFC 5322)
Date:                    <current UTC>
MIME-Version:            1.0
X-Priority:              3                                   (Normal — not 1/High)
X-MSMail-Priority:       Normal
Importance:              Normal
X-Mailer:                sekpriAI/1.0
Auto-Submitted:          auto-generated  (or auto-replied for replies)
X-Auto-Response-Suppress: OOF, AutoReply
Precedence:              normal
X-AI-Generated:          assisted        (only when AI drafted the email)
```

The `X-AI-Generated: assisted` header signals that a human reviewed the
draft before sending. This is distinct from `generated` (fully autonomous)
and is required for compliance with emerging AI transparency regulations
(EU AI Act Article 52).

### 11.4 Plain text requirement

Every outbound email must include a `text/plain` part, even when HTML is
present. HTML-only emails score significantly higher on SpamAssassin and
are often rejected by corporate mail servers. The adapter automatically
strips HTML tags to produce the plain text fallback if `bodyText` is not
provided.

### 11.5 AI prompt constraints

AI prompts for `draft-reply` and `compose` are explicitly instructed to:

- Write naturally, like a real person — not a template or marketing copy
- Avoid all spam trigger words listed in §11.2
- Avoid generic filler phrases ("I hope this email finds you well")
- Keep sentence structure varied — not formulaic
- Use plain text only (no HTML markup in the body)

These constraints are enforced in the prompt text, not just in post-processing,
because LLMs can produce spam-like patterns when given generic instructions.

### 11.6 Rate limiting

Default limits per account:

| Limit | Value | Rationale |
|-------|-------|-----------|
| Emails per hour | 30 | Gmail flags accounts sending >500/day; 30/hr is safe for personal use |
| Emails per day | (30 × 24 = 720 theoretical max) | Stays well below Gmail's 500/day limit for App Password accounts |

Rate limits are enforced in `lib/email/deliverability.ts` using an
in-process map. For multi-instance deployments, replace with a
Redis-backed or Supabase-backed counter.

### 11.7 Sender reputation best practices (operational)

These are not enforced in code but must be followed operationally:

1. **Warm up new accounts** — send a few manual emails and receive replies
   before enabling AI autonomous sending.
2. **Add sender to recipient's contacts** — Gmail and Outlook deprioritize
   email from unknown senders.
3. **Use a dedicated sending domain** for production — a custom domain with
   SPF, DKIM, and DMARC records configured provides the strongest
   deliverability guarantee. `@gmail.com` App Password accounts are
   acceptable for personal use but not for high-volume or business use.
4. **Monitor bounce rates** — high bounce rates (>2%) cause Gmail to
   throttle or block the sending account.
5. **For production scale** — replace SMTP with a dedicated transactional
   email service (Resend, SendGrid, Postmark) that manages IP reputation,
   DKIM signing, and bounce handling automatically.
