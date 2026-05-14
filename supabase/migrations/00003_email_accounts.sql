-- Phase 2: Email accounts table
-- Ref: specs/004-erd.md §3

create table email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gmail','office365','imap')),
  provider_label text,
  email_address text not null,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  imap_host text,
  imap_port int,
  smtp_host text,
  smtp_port int,
  imap_username text,
  imap_password_encrypted text,
  last_synced_at timestamptz,
  sync_status text default 'idle',
  created_at timestamptz default now()
);

create index idx_email_accounts_user_id on email_accounts (user_id);

-- RLS
alter table email_accounts enable row level security;

create policy "owner can read own accounts"
  on email_accounts for select
  using (auth.uid() = user_id);

create policy "owner can insert own accounts"
  on email_accounts for insert
  with check (auth.uid() = user_id);

create policy "owner can update own accounts"
  on email_accounts for update
  using (auth.uid() = user_id);

create policy "owner can delete own accounts"
  on email_accounts for delete
  using (auth.uid() = user_id);
