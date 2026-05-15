import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";
import { parseWithRetry } from "./parse-with-retry";

const outputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.string(),
  assumptions: z.string(),
  needs_approval: z.boolean(),
});

export type DraftReplyOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Draft a reply to this email. Respond with JSON only.

CRITICAL WRITING RULES to avoid spam filters:
- Write naturally, like a real person — not a template or marketing email
- Use conversational language appropriate to the original email's tone
- Keep sentences varied in length — mix short and longer ones
- NO excessive punctuation (!!!, ???), NO ALL CAPS words
- NO spam trigger phrases: "click here", "act now", "limited time", "free", "guaranteed"
- NO generic openers like "I hope this email finds you well" or "As per my last email"
- Be specific and direct — reference actual content from the original email
- Keep it concise — say what needs to be said, nothing more
- End naturally — no "Best regards, [AI Assistant]" type signatures

JSON schema:
{
  "subject": "Re: [original subject]",
  "body": "the reply text — plain text only, no HTML",
  "tone": "professional/casual/formal",
  "assumptions": "brief note on what you assumed",
  "needs_approval": true/false
}

Original email:
From: {from}
Subject: {subject}
Body:
{body}

{context}`;

export async function runDraftReply(input: {
  from: string;
  subject: string;
  body: string;
  context?: string;
}): Promise<DraftReplyOutput> {
  const client = getAIClient();

  const contextSection = input.context
    ? `Additional context (from memory and previous emails):\n${input.context}`
    : "";

  const userPrompt = USER_PROMPT.replace("{from}", input.from)
    .replace("{subject}", input.subject)
    .replace("{body}", input.body.slice(0, 3000))
    .replace("{context}", contextSection);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.chat({
    messages,
    temperature: 0.4,
    maxTokens: 2048,
  });

  return parseWithRetry(client, response.text, outputSchema, [
    ...messages,
    { role: "assistant" as const, content: response.text },
  ]);
}
