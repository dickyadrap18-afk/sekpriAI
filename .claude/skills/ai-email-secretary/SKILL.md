---
name: ai-email-secretary
description: |
  Generates a new AI prompt module with matching JSON schema, typed parser,
  and unit test. Use when adding a new AI capability (e.g., a new classifier,
  a new extraction prompt, or a new channel intent).
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# AI Email Secretary Skill

## When to use

Invoke this skill when you need to create a new AI prompt module under
`features/ai/prompts/`.

## What it generates

1. `features/ai/prompts/<name>.ts` containing:
   - System prompt string
   - User prompt template function
   - JSON schema for expected output
   - Typed parser with zod validation
   - Retry logic for malformed JSON
2. `features/ai/prompts/<name>.test.ts` with:
   - Happy path test (valid model output)
   - Malformed JSON test (retry behavior)
   - Edge case tests (empty input, missing fields)

## Template structure

```ts
// features/ai/prompts/<name>.ts
import { z } from 'zod';
import { getAIClient } from '../clients';

const SYSTEM_PROMPT = `...`;

const outputSchema = z.object({
  // define expected fields
});

export type <Name>Output = z.infer<typeof outputSchema>;

export async function run<Name>(input: <Name>Input): Promise<<Name>Output> {
  const client = getAIClient();
  const response = await client.chat({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
    ],
    jsonSchema: outputSchema,
  });
  return outputSchema.parse(JSON.parse(response.text));
}
```

## Rules

- Follow the global system prompt in `specs/005-ai-agent-spec.md` §2.
- Never invent facts. Use only provided context.
- Every prompt must define a JSON schema for structured output.
- Every prompt must have a typed parser that validates the response.
- Every prompt must log to `ai_actions` table via the orchestrator.
- Prompts must NOT import UI components or React.
- Prompts must NOT call provider SDKs directly.

## Safety rules (always include in system prompt)

- Never send email without user confirmation.
- If context is missing, say what is missing.
- Store extracted memory as pending, not active.

## Usage

```
/ai-email-secretary <prompt-name>
```

Example: `/ai-email-secretary sentiment-classifier`
