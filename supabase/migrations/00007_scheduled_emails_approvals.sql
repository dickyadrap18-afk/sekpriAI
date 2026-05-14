-- Phase 2: Scheduled emails and approval requests
-- Ref: specs/004-erd.md §3

create table scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid references email_accounts(id) on delete cascade,
  payload jsonb not null,
  scheduled_for timestamptz not null,
  approved_at timestamptz,
  sent_at timestamptz,
  status text default 'pending'
    check (status in ('pending','approved','sent','cancelled','failed')),
  error_text text,
  created_at timestamptz default now()
);

create index idx_scheduled_emails_user_status on scheduled_emails (user_id, status, scheduled_for);

create table approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  scheduled_email_id uuid references scheduled_emails(id) on delete cascade,
  kind text check (kind in ('send','schedule','memory_activate')),
  payload jsonb,
  status text default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  decided_at timestamptz,
  created_at timestamptz default now()
);

create index idx_approval_requests_user_status on approval_requests (user_id, status, created_at desc);

-- RLS for scheduled_emails
alter table scheduled_emails enable row level security;

create policy "owner can read own scheduled"
  on scheduled_emails for select
  using (auth.uid() = user_id);

create policy "owner can insert own scheduled"
  on scheduled_emails for insert
  with check (auth.uid() = user_id);

create policy "owner can update own scheduled"
  on scheduled_emails for update
  using (auth.uid() = user_id);

create policy "owner can delete own scheduled"
  on scheduled_emails for delete
  using (auth.uid() = user_id);

-- RLS for approval_requests
alter table approval_requests enable row level security;

create policy "owner can read own approvals"
  on approval_requests for select
  using (auth.uid() = user_id);

create policy "owner can insert own approvals"
  on approval_requests for insert
  with check (auth.uid() = user_id);

create policy "owner can update own approvals"
  on approval_requests for update
  using (auth.uid() = user_id);

create policy "owner can delete own approvals"
  on approval_requests for delete
  using (auth.uid() = user_id);
