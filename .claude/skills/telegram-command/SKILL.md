---
name: telegram-command
description: |
  Generates a new Telegram/WhatsApp command handler that plugs into the
  channel intent system. Use when adding a new natural-language command
  that users can send via Telegram or the WhatsApp mock.
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# Telegram Command Skill

## When to use

Invoke this skill when you need to add a new command that users can send
via Telegram bot or the WhatsApp mock chat.

## What it generates

1. New intent type added to `features/channels/types.ts`
2. Handler in `features/channels/server/handlers/<intent-name>.ts`
3. Test in `features/channels/server/handlers/<intent-name>.test.ts`
4. Updated intent parser examples in `features/ai/prompts/parse-channel-intent.ts`

## Architecture

```
features/channels/
  telegram/
    webhook.ts        # Telegram Bot API webhook handler
    notify.ts         # Send notifications to bound users
  whatsapp/
    mock-handler.ts   # WhatsApp mock endpoint
    components/       # Chat UI components
  server/
    handlers/         # One handler per intent type
      summarize.ts
      draft-reply.ts
      search.ts
      schedule.ts
      ...
    router.ts         # Routes parsed intent to correct handler
  types.ts            # ChannelIntent type definition
```

## Intent type contract

```ts
type ChannelIntent = {
  intent_type: string;       // e.g., 'summarize_latest', 'draft_reply'
  target?: string;           // name, email, message id, query
  instruction?: string;      // body text for replies
  requires_confirmation: boolean;
};
```

## Rules

- Every command handler must check `requires_confirmation` before executing side effects.
- Send commands ALWAYS require confirmation (no exceptions).
- Handlers must NOT import provider SDKs directly — use `features/email/server/*`.
- Handlers must NOT import AI clients directly — use `features/ai/server/*`.
- Unknown intents return the welcome/help message.
- All handler responses are plain text suitable for Telegram message format.

## Safety rules

- Never send email without explicit user confirmation in the channel.
- Always show draft preview before asking for send approval.
- Sensitive emails (business, legal, payment) require extra confirmation.

## Usage

```
/telegram-command <intent-name>
```

Example: `/telegram-command forward-email`
