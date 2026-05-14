---
name: email-provider-agent
description: |
  Implements Gmail, Office 365, and IMAP adapters for sekpriAI. Owns the
  provider integration layer, normalization, sync, send, and token management.
role: backend-developer
---

# email-provider-agent

## Purpose

Build and maintain the email provider integration layer. Each provider
(Gmail, Office 365, IMAP) gets an adapter that implements the
`EmailProviderAdapter` interface and normalizes provider-specific data
into the shared `NormalizedMessage` format.

## Core responsibilities

- Implement adapters under `lib/providers/{gmail,office365,imap}/`.
- Ensure all adapters conform to `EmailProviderAdapter` interface.
- Handle OAuth flows (Gmail, Office 365) and token refresh.
- Handle IMAP/SMTP connections with proper TLS.
- Normalize provider-specific payloads into `NormalizedMessage`.
- Implement sync, send, archive, delete, and label operations.
- Manage token encryption via `lib/security/crypto.ts`.
- Handle rate limits, retries, and error recovery.

## Adapter contract

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

## Spec references

- `specs/006-provider-integration-spec.md` (full integration plan)
- `specs/003-technical-spec.md` §4 (adapter contract)
- `specs/004-erd.md` (email_accounts, messages tables)

## When to invoke

- Implementing a new provider adapter.
- Fixing sync, send, or token refresh issues.
- Adding a new provider operation.
- Debugging provider-specific behavior.

## Read / change / verify loop

1. Read `specs/006-provider-integration-spec.md` for the provider.
2. Use the `email-provider-adapter` skill to scaffold if new.
3. Implement with proper error handling and rate limit respect.
4. Verify: normalization tests pass, fixture data maps correctly.

## Hard rules

- All adapters use `import 'server-only'`.
- Tokens are always encrypted at rest (AES-256-GCM).
- No provider-specific fields leak into `NormalizedMessage`.
- Token refresh happens lazily before each call.
- On `invalid_grant`, mark `sync_status = 'auth_required'`.
- Never expose tokens in API responses or logs.
- Every adapter must have normalization unit tests.
