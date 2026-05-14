import "server-only";

import type { AIClient, AIChatRequest, AIChatResponse } from "./types";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export function createOpenAIClient(): AIClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  return {
    provider: "openai",

    async chat(req: AIChatRequest): Promise<AIChatResponse> {
      const res = await fetch(OPENAI_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: req.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: req.temperature ?? 0.3,
          max_tokens: req.maxTokens || 1024,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      return {
        text,
        tokensInput: data.usage?.prompt_tokens || 0,
        tokensOutput: data.usage?.completion_tokens || 0,
        model: data.model || "gpt-4o",
      };
    },
  };
}
