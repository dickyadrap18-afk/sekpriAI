-- Phase 6: pgvector similarity search function for RAG retrieval
-- Ref: features/rag/server/retrieve.ts

create or replace function match_rag_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  content text,
  source_type text,
  source_id uuid,
  similarity float
)
language sql stable
as $$
  select
    rag_chunks.id,
    rag_chunks.content,
    rag_chunks.source_type,
    rag_chunks.source_id,
    1 - (rag_chunks.embedding <=> query_embedding) as similarity
  from rag_chunks
  where rag_chunks.user_id = filter_user_id
    and 1 - (rag_chunks.embedding <=> query_embedding) > match_threshold
  order by rag_chunks.embedding <=> query_embedding
  limit match_count;
$$;
