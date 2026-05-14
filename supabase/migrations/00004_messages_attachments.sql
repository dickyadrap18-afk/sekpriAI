-- Phase 2: Messages and attachments tables
-- Ref: specs/004-erd.md §3

create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references email_accounts(id) on delete cascade,
  provider text not null,
  provider_message_id text not null,
  provider_thread_id text,
  thread_id text,
  from_name text,
  from_email text not null,
  to_emails text[] default '{}',
  cc_emails text[] default '{}',
  subject text,
  body_text text,
  body_html text,
  snippet text,
  received_at timestamptz,
  is_read boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  labels text[] default '{}',
  ai_summary text,
  ai_priority text check (ai_priority in ('high','medium','low')),
  ai_priority_reason text,
  ai_risk_level text check (ai_risk_level in ('low','medium','high')),
  ai_risk_reason text,
  ai_processed_at timestamptz,
  created_at timestamptz default now(),
  unique (account_id, provider_message_id)
);

create index idx_messages_user_received on messages (user_id, received_at desc);
create index idx_messages_user_inbox on messages (user_id, is_archived, is_deleted, received_at desc);
create index idx_messages_user_priority on messages (user_id, ai_priority, received_at desc);

-- Attachments
create table attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  provider_attachment_id text,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  extracted_text text,
  created_at timestamptz default now()
);

create index idx_attachments_message_id on attachments (message_id);

-- RLS for messages
alter table messages enable row level security;

create policy "owner can read own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "owner can insert own messages"
  on messages for insert
  with check (auth.uid() = user_id);

create policy "owner can update own messages"
  on messages for update
  using (auth.uid() = user_id);

create policy "owner can delete own messages"
  on messages for delete
  using (auth.uid() = user_id);

-- RLS for attachments
alter table attachments enable row level security;

create policy "owner can read own attachments"
  on attachments for select
  using (auth.uid() = user_id);

create policy "owner can insert own attachments"
  on attachments for insert
  with check (auth.uid() = user_id);

create policy "owner can update own attachments"
  on attachments for update
  using (auth.uid() = user_id);

create policy "owner can delete own attachments"
  on attachments for delete
  using (auth.uid() = user_id);
