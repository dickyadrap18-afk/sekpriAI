import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";

const outputSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  should_notify: z.boolean(),
});

export type PriorityOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Classify the priority of this email. Respond with JSON only:
{
  "priority": "high" | "medium" | "low",
  "reason": "one sentence explaining why",
  "should_notify": true/false (true if user should be notified immediately)
}

High = urgent action required, deadline, important person, time-sensitive.
Medium = needs attention but not urgent.
Low = informational, newsletter, notification, no action needed.

Email:
From: {from}
Subject: {subject}
Snippet: {snippet}`;

export async function runPriority(input: {
  from: string;
  subject: string;
  snippet: string;
}): Promise<PriorityOutput> {
  const client = getAIClient();

  const userPrompt = USER_PROMPT.replace("{from}", input.from)
    .replace("{subject}", input.subject)
    .replace("{snippet}", input.snippet.slice(0, 500));

  const response = await client.chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
  });

  try {
    return outputSchema.parse(JSON.parse(response.text));
  } catch {
    const retry = await client.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
        { role: "assistant", content: response.text },
        { role: "user", content: "Reformat as valid JSON matching the schema." },
      ],
      temperature: 0,
    });
    return outputSchema.parse(JSON.parse(retry.text));
  }
}
