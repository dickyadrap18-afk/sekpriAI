import "server-only";

import type { AIClient, AIProvider } from "./types";
import { createClaudeClient } from "./claude";
import { createOpenAIClient } from "./openai";
import { createGeminiClient } from "./gemini";

/**
 * Get the configured AI client.
 * Default: claude. Override via AI_PROVIDER env var.
 * Ref: specs/005-ai-agent-spec.md §7
 */
export function getAIClient(override?: AIProvider): AIClient {
  const provider = override || (process.env.AI_PROVIDER as AIProvider) || "claude";

  switch (provider) {
    case "claude":
      return createClaudeClient();
    case "openai":
      return createOpenAIClient();
    case "gemini":
      return createGeminiClient();
    case "deepseek":
      // DeepSeek uses OpenAI-compatible API format
      if (process.env.DEEPSEEK_API_KEY) {
        return createOpenAIClient();
      }
      return createGeminiClient(); // fallback
    default:
      if (process.env.GEMINI_API_KEY) return createGeminiClient();
      if (process.env.ANTHROPIC_API_KEY) return createClaudeClient();
      if (process.env.OPENAI_API_KEY) return createOpenAIClient();
      throw new Error("No AI provider API key configured");
  }
}

export type { AIClient, AIProvider, AIChatRequest, AIChatResponse } from "./types";
