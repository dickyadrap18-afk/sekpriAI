import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";
import { parseWithRetry } from "./parse-with-retry";

const memoryItemSchema = z.object({
  memory_type: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1),
});

const outputSchema = z.array(memoryItemSchema);

export type ExtractMemoryOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Extract key facts, preferences, deadlines, or commitments from this email that would be useful to remember for future interactions. Respond with a JSON array:
[
  { "memory_type": "deadline|preference|fact|commitment|contact_info", "content": "...", "confidence": 0.0-1.0 }
]

Return an empty array [] if nothing worth remembering.
Only extract concrete, factual information. Do not speculate.

Email:
From: {from}
Subject: {subject}
Body:
{body}`;

export async function runExtractMemory(input: {
  from: string;
  subject: string;
  body: string;
}): Promise<ExtractMemoryOutput> {
  const client = getAIClient();

  const userPrompt = USER_PROMPT.replace("{from}", input.from)
    .replace("{subject}", input.subject)
    .replace("{body}", input.body.slice(0, 3000));

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.chat({
    messages,
    temperature: 0.2,
  });

  return parseWithRetry(client, response.text, outputSchema, [
    ...messages,
    { role: "assistant" as const, content: response.text },
  ]);
}
