import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";
import { parseWithRetry } from "./parse-with-retry";

const outputSchema = z.object({
  one_sentence_summary: z.string(),
  key_request: z.string().nullable(),
  deadline: z.string().nullable(),
  suggested_action: z.string().nullable(),
});

export type SummarizeOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Summarize this email. Respond with JSON only:
{
  "one_sentence_summary": "...",
  "key_request": "what is being asked (or null)",
  "deadline": "any deadline mentioned (or null)",
  "suggested_action": "what the user should do next (or null)"
}

Email:
From: {from}
Subject: {subject}
Body:
{body}`;

export async function runSummarize(input: {
  from: string;
  subject: string;
  body: string;
}): Promise<SummarizeOutput> {
  const client = getAIClient();

  const userPrompt = USER_PROMPT
    .replace("{from}", input.from)
    .replace("{subject}", input.subject)
    .replace("{body}", input.body.slice(0, 3000));

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.chat({ messages, temperature: 0.2 });

  return parseWithRetry(client, response.text, outputSchema, [
    ...messages,
    { role: "assistant" as const, content: response.text },
  ]);
}
