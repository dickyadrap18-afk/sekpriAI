import "server-only";

import type { ZodSchema } from "zod";
import type { AIClient, AIChatMessage } from "../clients/types";

/**
 * Parse AI response as JSON with one retry on failure.
 * Extracts the duplicated retry pattern from all prompt modules.
 * Ref: audit-report.md CQ-04
 */
export async function parseWithRetry<T>(params: {
  schema: ZodSchema<T>;
  client: AIClient;
  messages: AIChatMessage[];
  responseText: string;
}): Promise<T> {
  const { schema, client, messages, responseText } = params;

  // First attempt: parse directly
  try {
    return schema.parse(JSON.parse(responseText));
  } catch {
    // Retry: ask model to reformat
    const retry = await client.chat({
      messages: [
        ...messages,
        { role: "assistant", content: responseText },
        { role: "user", content: "Reformat as valid JSON matching the schema." },
      ],
      temperature: 0,
    });
    return schema.parse(JSON.parse(retry.text));
  }
}
