-- Phase 2: Memory items table
-- Ref: specs/004-erd.md §3

create table memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_message_id uuid references messages(id) on delete set null,
  memory_type text,
  content text not null,
  status text default 'pending'
    check (status in ('pending','active','rejected','deleted')),
  confidence numeric,
  created_by text default 'ai',
  approved_at timestamptz,
  created_at timestamptz default now()
);

create index idx_memory_items_user_status on memory_items (user_id, status);

-- RLS
alter table memory_items enable row level security;

create policy "owner can read own memory"
  on memory_items for select
  using (auth.uid() = user_id);

create policy "owner can insert own memory"
  on memory_items for insert
  with check (auth.uid() = user_id);

create policy "owner can update own memory"
  on memory_items for update
  using (auth.uid() = user_id);

create policy "owner can delete own memory"
  on memory_items for delete
  using (auth.uid() = user_id);
