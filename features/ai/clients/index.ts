import "server-only";

import type { AIClient, AIProvider } from "./types";
import { createClaudeClient } from "./claude";
import { createOpenAIClient } from "./openai";

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
      // Gemini uses OpenAI-compatible API format
      // For MVP, fall back to Claude if not configured
      if (process.env.GEMINI_API_KEY) {
        return createOpenAIClient(); // TODO: dedicated Gemini client
      }
      return createClaudeClient();
    case "deepseek":
      // DeepSeek uses OpenAI-compatible API format
      if (process.env.DEEPSEEK_API_KEY) {
        return createOpenAIClient(); // TODO: dedicated DeepSeek client
      }
      return createClaudeClient();
    default:
      return createClaudeClient();
  }
}

export type { AIClient, AIProvider, AIChatRequest, AIChatResponse } from "./types";
