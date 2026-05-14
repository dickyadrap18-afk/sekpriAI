import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";

const outputSchema = z.object({
  risk_level: z.enum(["low", "medium", "high"]),
  requires_approval: z.boolean(),
  reason: z.string(),
});

export type RiskOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Classify the risk level of this email for automated reply. Respond with JSON only:
{
  "risk_level": "low" | "medium" | "high",
  "requires_approval": true/false,
  "reason": "one sentence explaining why"
}

High risk (requires_approval=true): business decisions, payment, legal, contracts, pricing, client approval, confidential data, complaints.
Medium risk (requires_approval=true): important requests, scheduling commitments, sharing information.
Low risk (requires_approval=false): informational, newsletters, notifications, casual conversation.

Email:
From: {from}
Subject: {subject}
Body excerpt: {body}`;

export async function runRisk(input: {
  from: string;
  subject: string;
  body: string;
}): Promise<RiskOutput> {
  const client = getAIClient();

  const userPrompt = USER_PROMPT.replace("{from}", input.from)
    .replace("{subject}", input.subject)
    .replace("{body}", input.body.slice(0, 1500));

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
