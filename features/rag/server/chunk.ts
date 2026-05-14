import "server-only";

/**
 * Split text into bounded overlapping chunks for embedding.
 * Ref: specs/005-ai-agent-spec.md §5
 *
 * Max ~500 tokens per chunk (~2000 chars), 50-token overlap (~200 chars).
 */

const MAX_CHUNK_CHARS = 2000;
const OVERLAP_CHARS = 200;

export interface TextChunk {
  content: string;
  index: number;
}

export function chunkText(text: string): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= MAX_CHUNK_CHARS) {
    return [{ content: cleaned, index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = start + MAX_CHUNK_CHARS;

    // Try to break at a sentence boundary
    if (end < cleaned.length) {
      const lastPeriod = cleaned.lastIndexOf(". ", end);
      const lastNewline = cleaned.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + MAX_CHUNK_CHARS / 2) {
        end = breakPoint + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ content: chunk, index });
      index++;
    }

    start = end - OVERLAP_CHARS;
    if (start >= cleaned.length) break;
  }

  return chunks;
}
