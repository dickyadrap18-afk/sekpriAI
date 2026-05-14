import "server-only";

import type { AIClient, AIChatRequest, AIChatResponse } from "./types";

/**
 * Gemini AI client using the Google Generative AI REST API.
 * Uses gemini-2.0-flash model for fast, cost-effective responses.
 */

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

export function createGeminiClient(): AIClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  return {
    provider: "gemini",

    async chat(req: AIChatRequest): Promise<AIChatResponse> {
      const model = "gemini-2.0-flash";

      // Convert messages to Gemini format
      const systemInstruction = req.messages.find((m) => m.role === "system");
      const contents = req.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: req.temperature ?? 0.3,
          maxOutputTokens: req.maxTokens || 1024,
          responseMimeType: "application/json",
        },
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction.content }],
        };
      }

      const res = await fetch(
        `${GEMINI_API}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || "";

      return {
        text,
        tokensInput: data.usageMetadata?.promptTokenCount || 0,
        tokensOutput: data.usageMetadata?.candidatesTokenCount || 0,
        model,
      };
    },
  };
}
