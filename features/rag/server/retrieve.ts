import "server-only";

import { createClient } from "@supabase/supabase-js";
import { embedSingle } from "./embed";

/**
 * Retrieve relevant chunks from pgvector via cosine similarity.
 * Ref: specs/005-ai-agent-spec.md §5
 * Top-k = 6, threshold ~0.75
 */

export interface RetrievalResult {
  content: string;
  source_type: string;
  source_id: string;
  similarity: number;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function retrieveContext(
  userId: string,
  query: string,
  topK: number = 6
): Promise<RetrievalResult[]> {
  const embedding = await embedSingle(query);
  const supabase = getServiceClient();

  // Use Supabase's pgvector similarity search via RPC
  // This requires a function in the database. For MVP, use a raw query approach.
  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: topK,
    filter_user_id: userId,
  });

  if (error) {
    console.error("RAG retrieval error:", error.message);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    content: row.content as string,
    source_type: row.source_type as string,
    source_id: row.source_id as string,
    similarity: row.similarity as number,
  }));
}

/**
 * Format retrieved chunks into a context string for prompts.
 */
export function formatContext(results: RetrievalResult[]): string {
  if (results.length === 0) return "";

  return results
    .map(
      (r, i) =>
        `[Context ${i + 1} (${r.source_type}, similarity: ${r.similarity.toFixed(2)})]:\n${r.content}`
    )
    .join("\n\n");
}
