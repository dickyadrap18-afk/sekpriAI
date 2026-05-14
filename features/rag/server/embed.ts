import "server-only";

/**
 * Generate embeddings for text chunks.
 * Uses OpenAI embeddings API (text-embedding-3-small, 1536 dimensions).
 * Ref: specs/005-ai-agent-spec.md §5
 */

const OPENAI_EMBEDDINGS_API = "https://api.openai.com/v1/embeddings";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("No embedding API key configured (OPENAI_API_KEY)");
  }

  // Use OpenAI embeddings (most widely available, 1536 dims)
  const res = await fetch(OPENAI_EMBEDDINGS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!res.ok) {
    throw new Error(`Embedding API error: ${res.status}`);
  }

  const data = await res.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

export async function embedSingle(text: string): Promise<number[]> {
  const results = await embedTexts([text]);
  return results[0];
}
