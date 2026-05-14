---
name: rag-memory
description: |
  Generates RAG indexing and retrieval glue code. Use when adding a new
  source type to the RAG pipeline (e.g., a new attachment format) or when
  setting up the initial RAG infrastructure.
author: sekpriAI team
version: 1.0.0
user-invocable: true
---

# RAG Memory Skill

## When to use

Invoke this skill when you need to:
- Add a new document type to the extraction pipeline
- Set up the chunking/embedding/retrieval infrastructure
- Wire RAG context into a new prompt module

## What it generates

### For new source type extraction:
1. `features/rag/server/extractors/<type>.ts` — text extraction for the format
2. `features/rag/server/extractors/<type>.test.ts` — unit test with fixture

### For initial RAG setup:
1. `features/rag/server/chunk.ts` — bounded overlapping chunker
2. `features/rag/server/embed.ts` — embedding via AI client
3. `features/rag/server/retrieve.ts` — cosine similarity query (top-k=6)
4. `features/rag/server/index.ts` — orchestrator: extract → chunk → embed → store

## Architecture

```
features/rag/
  server/
    extractors/
      pdf.ts          # PDF text extraction
      txt.ts          # Plain text passthrough
      docx.ts         # DOCX text extraction
    chunk.ts          # Split text into bounded overlapping chunks
    embed.ts          # Generate embeddings via AI client
    retrieve.ts       # Cosine similarity search in rag_chunks
    index.ts          # Orchestrate: extract → chunk → embed → store
  types.ts            # RAGChunk, RetrievalResult types
```

## Rules

- Extraction runs server-side only (`import 'server-only'`).
- Chunks have max 500 tokens with 50-token overlap.
- Embeddings use the AI client's `embed()` method (1536 dimensions).
- Retrieval filters by `user_id` (RLS enforced).
- Top-k = 6, cosine similarity threshold ~0.75.
- Files > 10 MB are skipped with a log entry.
- Never send raw attachment content to the client.

## Database reference

```sql
create table rag_chunks (
  id uuid primary key,
  user_id uuid references auth.users(id),
  source_type text check (source_type in ('email','attachment','memory')),
  source_id uuid,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

## Usage

```
/rag-memory setup          # Generate full RAG infrastructure
/rag-memory extractor pdf  # Add PDF extraction support
```
