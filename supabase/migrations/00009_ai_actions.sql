-- Phase 2: AI actions audit log
-- Ref: specs/004-erd.md §3

create table ai_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature text not null,
  input jsonb,
  output jsonb,
  model text,
  tokens_input int,
  tokens_output int,
  created_at timestamptz default now()
);

create index idx_ai_actions_user_feature on ai_actions (user_id, feature, created_at desc);

-- RLS
alter table ai_actions enable row level security;

create policy "owner can read own actions"
  on ai_actions for select
  using (auth.uid() = user_id);

create policy "owner can insert own actions"
  on ai_actions for insert
  with check (auth.uid() = user_id);

create policy "owner can update own actions"
  on ai_actions for update
  using (auth.uid() = user_id);

create policy "owner can delete own actions"
  on ai_actions for delete
  using (auth.uid() = user_id);
