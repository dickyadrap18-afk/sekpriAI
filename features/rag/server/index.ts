import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";
import type { RAGSourceType } from "@/lib/supabase/types";

export async function indexContent(params: {
  userId: string;
  sourceType: RAGSourceType;
  sourceId: string;
  text: string;
}): Promise<number> {
  const { userId, sourceType, sourceId, text } = params;

  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const embeddings = await embedTexts(chunks.map((c) => c.content));
  const supabase = getServiceClient();

  // Delete existing chunks for this source (re-index)
  await supabase
    .from("rag_chunks")
    .delete()
    .eq("user_id", userId)
    .eq("source_id", sourceId);

  // Insert new chunks
  const rows = chunks.map((chunk, i) => ({
    user_id: userId,
    source_type: sourceType,
    source_id: sourceId,
    content: chunk.content,
    embedding: embeddings[i],
    metadata: { chunk_index: chunk.index },
  }));

  const { error } = await supabase.from("rag_chunks").insert(rows);

  if (error) {
    console.error("RAG index error:", error.message);
    return 0;
  }

  return chunks.length;
}
