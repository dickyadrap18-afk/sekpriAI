---
name: email-provider-adapter
description: |
  Generates a new EmailProviderAdapter implementation skeleton that conforms
  to the contract in lib/providers/types.ts. Use when adding a new email
  provider (e.g., a new IMAP variant or a future provider).
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# Email Provider Adapter Skill

## When to use

Invoke this skill when you need to create a new email provider adapter that
implements the `EmailProviderAdapter` interface.

## What it generates

1. A new folder under `lib/providers/<provider-name>/`
2. Files:
   - `index.ts` — factory function `create<Name>Adapter(account): EmailProviderAdapter`
   - `sync.ts` — `syncMessages` implementation
   - `send.ts` — `sendMessage` implementation
   - `actions.ts` — `archiveMessage`, `deleteMessage`, `applyLabel`
   - `normalize.ts` — provider-specific payload → `NormalizedMessage` mapper
   - `normalize.test.ts` — unit tests for normalization with fixture data
3. A fixture file under `tests/fixtures/<provider-name>/sample-message.json`

## Contract reference

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

Full types: `specs/003-technical-spec.md` §4 and `lib/providers/types.ts`.

## Rules

- The adapter must NOT import UI components or React.
- The adapter must use `import 'server-only'` at the top.
- Token decryption uses `lib/security/crypto.ts`.
- All HTTP calls to external APIs must handle rate limits and token refresh.
- The normalize function must produce a valid `NormalizedMessage` — no provider-specific fields leak out.
- Every adapter must have at least one unit test for normalization.

## Usage

```
/email-provider-adapter <provider-name>
```

Example: `/email-provider-adapter protonmail`
