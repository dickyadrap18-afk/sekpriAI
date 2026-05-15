import "server-only";

import type { ZodSchema } from "zod";
import type { AIClient } from "../clients/types";

/**
 * Parse AI response as JSON with one automatic retry on failure.
 * Extracted from individual prompt modules to eliminate duplication.
 * Ref: audit-report.md CQ-04
 *
 * @param client - AI client instance
 * @param response - Initial response text from AI
 * @param schema - Zod schema to validate against
 * @param retryMessages - Messages to send on retry (includes original conversation)
 */
export async function parseWithRetry<T>(
  client: AIClient,
  response: string,
  schema: ZodSchema<T>,
  retryMessages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<T> {
  // Strip markdown code fences and extract JSON
  function extractJson(text: string): T {
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in response");
    return schema.parse(JSON.parse(match[0]));
  }

  try {
    return extractJson(response);
  } catch {
    // Retry with explicit reformat instruction
    const retry = await client.chat({
      messages: [
        ...retryMessages,
        {
          role: "user",
          content: "Reformat your response as valid JSON matching the schema. Return ONLY the JSON object, no other text, no markdown.",
        },
      ],
      temperature: 0,
    });

    return extractJson(retry.text);
  }
}
