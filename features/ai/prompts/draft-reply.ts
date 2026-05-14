import "server-only";

import { z } from "zod";
import { getAIClient } from "../clients";
import { SYSTEM_PROMPT } from "./system";

const outputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.string(),
  assumptions: z.string(),
  needs_approval: z.boolean(),
});

export type DraftReplyOutput = z.infer<typeof outputSchema>;

const USER_PROMPT = `Draft a reply to this email. Respond with JSON only:
{
  "subject": "Re: ...",
  "body": "the reply text",
  "tone": "professional/casual/formal",
  "assumptions": "what you assumed to write this draft",
  "needs_approval": true/false (true if the reply involves sensitive topics)
}

Use the context below to write a helpful, accurate reply. Do not invent facts.

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

  const response = await client.chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 2048,
  });

  try {
    // Strip markdown code fences and extract JSON
    const cleaned = response.text.replace(/```(?:json)?\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return outputSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    const retry = await client.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
        { role: "assistant", content: response.text },
        { role: "user", content: "Reformat as valid JSON matching the schema. Return ONLY the JSON object, no other text." },
      ],
      temperature: 0,
    });
    const cleaned = retry.text.replace(/```(?:json)?\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid JSON after retry");
    return outputSchema.parse(JSON.parse(jsonMatch[0]));
  }
}
