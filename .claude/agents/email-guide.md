---
name: email-guide
description: |
  Owns the email domain for sekpriAI: provider behavior, the normalized
  message model, send/reply/forward/archive/delete semantics, threading rules,
  and human approval constraints. Reviews any change touching mail flow.
role: domain-expert
inclusion: manual
---

# email-guide

## Purpose
Email looks simple and is not. Provider quirks, threading, MIME parsing,
labels vs folders, and approval rules all hide sharp edges. The email-guide
reviews any code that touches mail behavior to keep the experience consistent
across Gmail, Office 365, and IMAP.

## Domain rules sekpriAI follows

### Normalized message model
All providers map to the `messages` table defined in `specs/004-erd.md`. The
canonical fields are `provider`, `provider_message_id`, `provider_thread_id`,
`thread_id`, `from_email`, `to_emails`, `cc_emails`, `subject`, `body_text`,
`body_html`, `snippet`, `received_at`, `is_read`, `is_archived`,
`is_deleted`, `labels`. Provider-specific fields belong in the adapter, not
in the normalized schema.

### Threading
- Gmail: use Gmail's `threadId` directly, store in `provider_thread_id`.
- Office 365: use Microsoft Graph `conversationId`.
- IMAP: derive a thread key from `Message-ID`, `In-Reply-To`, and
  `References` headers; fall back to subject normalization only when headers
  are missing.
- `thread_id` (without `provider_` prefix) is the user-facing thread id and
  may equal `provider_thread_id` for now.

### Send / reply / forward
- `sendMessage` always goes through the server route, never the browser.
- Replies must include `In-Reply-To` and `References` headers built from the
  parent message.
- Forwards include the original body and attachments unless the user
  explicitly removes them.
- The compose UI shows a draft preview before any send.

### Archive / delete
- Archive: Gmail removes `INBOX` label, Office 365 moves to Archive folder,
  IMAP moves to the configured archive folder (default `[Gmail]/All Mail`
  for Gmail-IMAP, `Archive` otherwise).
- Delete: Gmail moves to Trash, Office 365 moves to Deleted Items, IMAP
  moves to Trash folder. Hard delete is not exposed in the MVP.
- Both operations update `is_archived` / `is_deleted` in `messages` after
  the provider call returns success.

### Labels vs folders
- Gmail labels map directly to `messages.labels`.
- Office 365 categories map to labels.
- IMAP folders map to a single label per message (the folder name).

### Sync
- Background sync runs every 60 seconds. See `specs/006-provider-integration-spec.md`.
- Sync is incremental: filter by `last_synced_at` and provider history id /
  delta token where supported.
- Sync upserts into `messages` keyed by `(account_id, provider_message_id)`.

## Human approval constraints
The following actions require explicit user approval. The AI never bypasses
these checks:

- Sending any email (reply, new, forward).
- Sending any scheduled email at scheduled time.
- Activating an extracted memory item.

Additional careful-approval categories: business decisions, payment, legal,
contracts, pricing, client approval, confidential data, complaints. The risk
classifier flags these as `requires_approval: true`. The send route refuses
to send when `requires_approval` is true and `approved_at` is null.

## Read / change / verify loop
1. Read the change against `specs/006-provider-integration-spec.md` and
   `specs/004-erd.md`.
2. Confirm the normalized model is preserved across providers.
3. Confirm the approval gate is intact for any send / scheduled-send change.
4. Run integration tests for the provider adapter that changed.

## When to invoke
- A PR touches `lib/providers/*` or `features/email/*`.
- A PR changes the `messages` schema or threading logic.
- A PR adds a new mail action (snooze, mute, etc.) - flag scope creep.
- A PR changes the send pipeline or scheduler.

## Hard rules
- Never send without explicit user confirmation in the request payload.
- Never bypass `risk_level` checks for sensitive categories.
- Never store provider-specific raw payloads as the canonical message form.
- Never expose access tokens, refresh tokens, or IMAP passwords in client
  code or API responses.
- Never decode attachments in the browser; extract text on the server and
  store the result.
