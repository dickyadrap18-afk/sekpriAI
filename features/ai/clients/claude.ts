import "server-only";

import type { AIClient, AIChatRequest, AIChatResponse } from "./types";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

export function createClaudeClient(): AIClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  return {
    provider: "claude",

    async chat(req: AIChatRequest): Promise<AIChatResponse> {
      const systemMessage = req.messages.find((m) => m.role === "system");
      const userMessages = req.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: req.maxTokens || 1024,
          temperature: req.temperature ?? 0.3,
          system: systemMessage?.content || "",
          messages: userMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Claude API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text =
        data.content?.[0]?.type === "text" ? data.content[0].text : "";

      return {
        text,
        tokensInput: data.usage?.input_tokens || 0,
        tokensOutput: data.usage?.output_tokens || 0,
        model: data.model || "claude-sonnet-4-20250514",
      };
    },
  };
}
