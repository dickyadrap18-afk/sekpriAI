import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";
import { parseWithRetry } from "./parse-with-retry";

const outputSchema = z.object({
  intent_type: z.enum([
    "summarize_latest",
    "draft_reply",
    "reply_with_text",
    "list_urgent",
    "search",
    "schedule_send",
    "send_approved",
    "cancel_scheduled",
    "unknown",
  ]),
  target: z.string().nullable(),
  instruction: z.string().nullable(),
  requires_confirmation: z.boolean(),
});

export type ChannelIntent = z.infer<typeof outputSchema>;

const USER_PROMPT = `Parse this natural language command into a structured intent. Respond with JSON only:
{
  "intent_type": "summarize_latest" | "draft_reply" | "reply_with_text" | "list_urgent" | "search" | "schedule_send" | "send_approved" | "cancel_scheduled" | "unknown",
  "target": "name, email, query, or null",
  "instruction": "body text or scheduling details, or null",
  "requires_confirmation": true/false (true for any send or schedule action)
}

Command: {command}`;

export async function runParseChannelIntent(command: string): Promise<ChannelIntent> {
  const client = getAIClient();

  const userPrompt = USER_PROMPT.replace("{command}", command);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.chat({
    messages,
    temperature: 0.1,
  });

  return parseWithRetry(client, response.text, outputSchema, [
    ...messages,
    { role: "assistant" as const, content: response.text },
  ]);
}
