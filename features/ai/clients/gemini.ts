import "server-only";

import type { AIClient, AIChatRequest, AIChatResponse } from "./types";

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";

export function createGeminiClient(): AIClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured. Set it in your environment variables.");

  return {
    provider: "gemini",

    async chat(req: AIChatRequest): Promise<AIChatResponse> {
      const model = "gemini-2.0-flash";

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
          // No responseMimeType — let model return plain text, we parse JSON manually
        },
      };

      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
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
        const errText = await res.text();
        let errJson: Record<string, unknown> = {};
        try { errJson = JSON.parse(errText); } catch { /* raw text */ }

        const status = res.status;
        const message = (errJson?.error as Record<string, unknown>)?.message as string || errText;

        // Specific, honest error messages
        if (status === 429) {
          throw new Error(
            "Gemini API quota exceeded. You have run out of free-tier requests. " +
            "Check your quota at https://aistudio.google.com or upgrade your plan."
          );
        }
        if (status === 400 && message.includes("API_KEY")) {
          throw new Error("Gemini API key is invalid. Please check your GEMINI_API_KEY environment variable.");
        }
        if (status === 403) {
          throw new Error("Gemini API access denied. Your API key may not have permission for this model.");
        }
        if (status === 503 || status === 500) {
          throw new Error(`Gemini API is temporarily unavailable (${status}). Please try again in a moment.`);
        }

        throw new Error(`Gemini API error ${status}: ${message.slice(0, 200)}`);
      }

      const data = await res.json();

      // Check for blocked content
      const candidate = data.candidates?.[0];
      if (!candidate) {
        const blockReason = data.promptFeedback?.blockReason;
        if (blockReason) {
          throw new Error(`Gemini blocked this request: ${blockReason}. The content may have triggered safety filters.`);
        }
        throw new Error("Gemini returned an empty response. The model may have refused to generate content.");
      }

      // Check finish reason
      const finishReason = candidate.finishReason;
      if (finishReason === "MAX_TOKENS") {
        // Still return what we got, but log a warning
        console.warn("Gemini response was truncated due to MAX_TOKENS limit. Consider increasing maxTokens.");
      }
      if (finishReason === "SAFETY") {
        throw new Error("Gemini blocked the response due to safety filters. Try rephrasing your request.");
      }

      const text = candidate?.content?.parts?.[0]?.text || "";
      if (!text) {
        throw new Error("Gemini returned an empty text response. The model may have failed to generate content.");
      }

      return {
        text,
        tokensInput: data.usageMetadata?.promptTokenCount || 0,
        tokensOutput: data.usageMetadata?.candidatesTokenCount || 0,
        model,
      };
    },
  };
}
