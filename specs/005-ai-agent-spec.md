# 005 - AI Agent Spec

> Source of truth: [`docs/sekpriAI_Source_of_Truth_Blueprint.md`](../docs/sekpriAI_Source_of_Truth_Blueprint.md) §7.

## 1. Capabilities

The sekpriAI assistant can:

- Summarize emails and threads.
- Draft replies using email content, thread history, approved memory, and
  retrieved RAG context.
- Classify priority as `high`, `medium`, or `low`.
- Classify risk as `low`, `medium`, or `high`.
- Extract pending memory candidates from any email.
- Retrieve context from email body and attachments via pgvector.
- Interpret natural-language commands from Telegram and the WhatsApp mock.
- Prepare scheduled sends after explicit user approval.

## 2. Global system prompt

```
You are sekpriAI, an AI-first email secretary.

Your job is to help the user manage email only. Do not create calendar
events, tasks, notes, contacts, or CRM records.

You can summarize emails, classify priority, classify risk, draft replies,
search email context, use approved memory, use retrieved email and attachment
context, prepare scheduled emails, notify the user about important messages,
and interpret natural-language commands from Telegram or WhatsApp mock
channels.

Safety rules:
1. Never send an email unless the user explicitly confirms the send action.
2. If an email involves business decisions, payment, legal matters,
   contracts, pricing, client approval, confidential data, or complaints,
   always require human approval.
3. Always show the draft before asking for approval.
4. If the command is ambiguous, prepare a draft and ask for confirmation.
5. Do not invent facts. Use email content, approved memory, and retrieved
   context.
6. If context is missing, say what is missing.
7. Default language is English unless the user uses another language or
   asks for another language.
8. Keep responses concise and useful.
9. Store extracted memory as pending, not active.
10. Notify only high-priority or AI-selected important emails.
```

## 3. Prompt modules

Prompts live in `features/ai/prompts/*.ts`. Each module exports:
- the prompt string,
- the JSON schema for the expected output,
- a typed parser that validates the model response.

| Prompt module                | Output schema                                                         |
| ---------------------------- | --------------------------------------------------------------------- |
| `summarize.ts`               | `{ one_sentence_summary, key_request, deadline, suggested_action }`   |
| `priority.ts`                | `{ priority: 'high'|'medium'|'low', reason, should_notify: boolean }` |
| `risk.ts`                    | `{ risk_level: 'low'|'medium'|'high', requires_approval, reason }`    |
| `draft-reply.ts`             | `{ subject, body, tone, assumptions, needs_approval }`                |
| `extract-memory.ts`          | `Array<{ memory_type, content, confidence }>`                         |
| `parse-channel-intent.ts`    | `{ intent_type, target, instruction, requires_confirmation }`         |

All prompts use JSON-mode / structured output where the AI client supports
it. When a model returns malformed JSON, the parser retries once with a
"reformat as valid JSON" follow-up before failing the request.

## 4. Triggering matrix

| Trigger                          | Prompts run                                  |
| -------------------------------- | -------------------------------------------- |
| New message synced               | `summarize`, `priority`, `risk`              |
| User opens message               | (cached) summary, priority, risk             |
| User clicks "AI draft reply"     | `draft-reply` (uses memory + RAG)            |
| User clicks "Save key info"      | `extract-memory` (manual)                    |
| Background memory pass per email | `extract-memory` (status `pending`)          |
| Telegram or WhatsApp message     | `parse-channel-intent` then routed prompt    |

`priority` and `risk` may be combined into one call to save tokens, but
their schemas remain distinct.

## 5. RAG retrieval

- Inputs to `draft-reply` and channel intents may include retrieved chunks
  from `rag_chunks` filtered by `user_id`.
- Top-k = 6 by default, with cosine similarity threshold ~0.75.
- Always include the source message (and the immediate prior message in the
  thread, if any) in the prompt context, separately from RAG hits.

## 6. Memory usage rules

- Active memory items (`status = 'active'`) are eligible to enter prompts.
- Pending, rejected, or deleted memory items must never be sent to the
  model.
- Each prompt call logs which memory ids were used in `ai_actions.input`.

## 7. Provider abstraction

The AI client is selected via `AI_PROVIDER` env var with `claude` as
default. See `specs/003-technical-spec.md` §5 for the contract.

Per-feature defaults can be overridden by env (e.g.,
`AI_DRAFT_PROVIDER=openai`) but the MVP uses one provider for everything.

## 8. Audit and observability

Every model call writes one row to `ai_actions`:
- `feature`: which prompt module ran.
- `input`: redacted prompt input (no full email body in plaintext - store a
  hash + message id).
- `output`: structured output.
- `model`, `tokens_input`, `tokens_output`.

This row is the audit trail and the input for any future debugging.

## 9. Failure modes

- Model timeout: degrade gracefully. The UI shows the message without the
  AI card and a small "AI unavailable" badge.
- Invalid JSON output: retry once with a reformat instruction. On second
  failure, log and skip.
- Rate limit: exponential backoff with jitter, max 3 attempts.

## 10. Test cases (high level)

- A high-priority email with the word "urgent" classifies as `high`.
- A pricing email classifies risk as `medium` or `high` and sets
  `requires_approval: true`.
- A vague reply request produces a draft and `needs_approval: true`.
- Memory extraction returns an array (possibly empty) and never `null`.
- Channel intent parser returns a valid `intent_type` even on noisy input.

Detailed cases live in `specs/008-testing-spec.md`.
