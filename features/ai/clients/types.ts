/**
 * AI provider abstraction.
 * Ref: specs/003-technical-spec.md §5, specs/005-ai-agent-spec.md
 */

export type AIProvider = "claude" | "openai" | "gemini" | "deepseek";

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIChatResponse {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

export interface AIClient {
  provider: AIProvider;
  chat(req: AIChatRequest): Promise<AIChatResponse>;
}
