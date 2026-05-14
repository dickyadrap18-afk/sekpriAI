-- Phase 2: Telegram bindings table
-- Ref: specs/004-erd.md §3

create table telegram_bindings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  binding_code text unique,
  telegram_user_id text,
  telegram_chat_id text,
  bound_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table telegram_bindings enable row level security;

create policy "owner can read own bindings"
  on telegram_bindings for select
  using (auth.uid() = user_id);

create policy "owner can insert own bindings"
  on telegram_bindings for insert
  with check (auth.uid() = user_id);

create policy "owner can update own bindings"
  on telegram_bindings for update
  using (auth.uid() = user_id);

create policy "owner can delete own bindings"
  on telegram_bindings for delete
  using (auth.uid() = user_id);
