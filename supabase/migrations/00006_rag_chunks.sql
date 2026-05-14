-- Phase 2: RAG chunks table (pgvector)
-- Ref: specs/004-erd.md §3

create table rag_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_type text check (source_type in ('email','attachment','memory')),
  source_id uuid,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_rag_chunks_embedding on rag_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_rag_chunks_user_source on rag_chunks (user_id, source_type);

-- RLS
alter table rag_chunks enable row level security;

create policy "owner can read own chunks"
  on rag_chunks for select
  using (auth.uid() = user_id);

create policy "owner can insert own chunks"
  on rag_chunks for insert
  with check (auth.uid() = user_id);

create policy "owner can update own chunks"
  on rag_chunks for update
  using (auth.uid() = user_id);

create policy "owner can delete own chunks"
  on rag_chunks for delete
  using (auth.uid() = user_id);
