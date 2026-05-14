# 007 - Telegram and WhatsApp Mock Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §8.
> The blueprint refers to this file as `007-channels-spec.md`. The repo
> uses the more descriptive name `007-telegram-whatsapp-spec.md`. Both
> point to the same content.

## 1. Overview

sekpriAI exposes two command channels:

- **Telegram**: real bot integration via the Telegram Bot API. Used for
  notifications and natural-language email commands.
- **WhatsApp**: a fully simulated chat UI inside the app. Same command
  parser as Telegram. No real WhatsApp API.

Both channels share the same intent parser (`parse-channel-intent` in
`features/ai/prompts/parse-channel-intent.ts`) and the same command
executors in `features/channels/server/*`.

## 2. Telegram binding flow

1. User opens Channels page in the app.
2. User clicks **Connect Telegram**.
3. App generates a unique binding code (e.g., 8-character base32) and
   stores it in `telegram_bindings` with `user_id` and `binding_code`.
4. UI shows the code and a deep link
   `https://t.me/<bot_username>?start=<binding_code>`.
5. User opens Telegram and presses Start, sending `/start <binding_code>`.
6. Bot webhook `POST /api/telegram/webhook` receives the message and:
   - validates the secret in the URL path,
   - looks up the binding code,
   - records `telegram_user_id`, `telegram_chat_id`, `bound_at`.
7. Bot sends the welcome message (below).

## 3. Welcome message

```
Welcome to sekpriAI.

I am your AI email secretary. I can notify you about important emails,
summarize threads, draft replies, and help you send or schedule emails
after your approval.

Try:
- Summarize my latest email
- Draft a reply to Sarah
- What urgent emails did I receive today?
- Schedule this reply for tomorrow morning
- Send the approved draft

I will ask for confirmation before sending sensitive emails.
```

## 4. Supported natural commands

The same set works in Telegram and the WhatsApp mock:

- "Summarize my latest email"
- "Draft a reply to <name or email>"
- "Reply to the last email and say <text>"
- "What urgent emails came in today?"
- "Search emails about <topic>"
- "Schedule this reply for <when>"
- "Send the approved draft"
- "Cancel the scheduled email"

## 5. Intent parser output

```ts
type ChannelIntent = {
  intent_type:
    | 'summarize_latest'
    | 'draft_reply'
    | 'reply_with_text'
    | 'list_urgent'
    | 'search'
    | 'schedule_send'
    | 'send_approved'
    | 'cancel_scheduled'
    | 'unknown';
  target?: string;          // e.g., a name, email, message id, query
  instruction?: string;     // e.g., the body to include in a reply
  requires_confirmation: boolean;
};
```

Implementation lives in `features/ai/prompts/parse-channel-intent.ts`.

## 6. Command execution rules

- A `summarize_latest` intent runs the summary prompt on the most recent
  unread message and returns the structured summary.
- A `draft_reply` or `reply_with_text` intent always produces a draft and
  asks for confirmation in the same channel before sending.
- A `schedule_send` intent creates a row in `scheduled_emails` with
  `status = 'pending'` and an associated `approval_request`.
- A `send_approved` intent flushes the latest approved-but-unsent
  scheduled email (or refuses if none exist).
- A `cancel_scheduled` intent updates the row to `status = 'cancelled'`.
- An `unknown` intent returns the welcome help text.

## 7. Notifications (Telegram only)

- After AI processing of a synced batch, any message with `ai_priority =
  'high'` (and `should_notify = true` from the priority prompt) triggers
  a Telegram message to the user's bound chat:

  ```
  High priority email
  From: <from>
  Subject: <subject>

  <one_sentence_summary>
  ```

- Notifications are deduplicated per `(user_id, message_id)` using an
  `ai_actions` row with `feature = 'telegram_notify'`.

## 8. WhatsApp mock

- Lives at `features/channels/whatsapp/*`.
- Renders a chat-like UI with bubble alignment, input box, send button.
- The "send" handler calls `POST /api/whatsapp/mock` which routes through
  the same intent parser and command executor as Telegram.
- No outbound calls are made to any WhatsApp API. The UI clearly labels
  itself as a demo of future channel expansion.

## 9. Security

- Webhook URL contains a secret path segment configured via
  `TELEGRAM_WEBHOOK_SECRET` and validated on every request.
- The webhook handler ignores updates from unbound `telegram_user_id`
  values, except for `/start` messages.
- The mock WhatsApp endpoint requires the user's authenticated Supabase
  session.

## 10. Test cases (high level)

- A `/start <invalid_code>` produces a friendly error and no binding row.
- A `/start <valid_code>` produces a binding row and welcome message.
- A "Summarize my latest email" command returns the summary for the most
  recent message owned by the bound user.
- A "Send the approved draft" command refuses when no approved scheduled
  email exists.
- The WhatsApp mock UI renders user and bot messages in correct order and
  handles loading state during AI calls.

Detailed cases live in `specs/008-testing-spec.md`.
