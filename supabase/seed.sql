-- Seed data for development
-- This inserts demo messages for testing the inbox UI.
-- Run after a user has signed up. Replace the user_id with your actual user UUID.
--
-- Usage:
--   1. Sign up via the app (creates auth.users + profiles row)
--   2. Copy your user UUID from Supabase dashboard or profiles table
--   3. Replace 'YOUR_USER_ID_HERE' below
--   4. Run: psql <connection_string> -f supabase/seed.sql

-- Example: create a demo email account
insert into email_accounts (id, user_id, provider, email_address, display_name, sync_status)
values (
  '00000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID_HERE',
  'gmail',
  'demo@gmail.com',
  'Demo Gmail',
  'idle'
) on conflict do nothing;

-- Example: insert demo messages
insert into messages (user_id, account_id, provider, provider_message_id, from_name, from_email, to_emails, subject, snippet, body_text, received_at, is_read, labels, ai_priority, ai_priority_reason, ai_summary)
values
  ('YOUR_USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'gmail', 'msg-001', 'Alice Johnson', 'alice@company.com', '{demo@gmail.com}', 'Q3 Budget Review - Action Required', 'Please review the attached Q3 budget proposal...', 'Hi,\n\nPlease review the attached Q3 budget proposal and provide your feedback by Friday.\n\nBest,\nAlice', now() - interval '2 hours', false, '{INBOX,IMPORTANT}', 'high', 'Contains action required and deadline', 'Alice requests Q3 budget review with Friday deadline.'),

  ('YOUR_USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'gmail', 'msg-002', 'Bob Smith', 'bob@startup.io', '{demo@gmail.com}', 'Re: Partnership Proposal', 'Thanks for the proposal. Let me discuss with...', 'Thanks for the proposal. Let me discuss with the team and get back to you next week.\n\nBob', now() - interval '5 hours', true, '{INBOX}', 'medium', 'Business discussion, no immediate action', 'Bob will discuss partnership proposal with team next week.'),

  ('YOUR_USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'gmail', 'msg-003', 'Newsletter', 'news@techdigest.com', '{demo@gmail.com}', 'Weekly Tech Digest #142', 'This week: AI breakthroughs, new frameworks...', 'This week in tech:\n- AI breakthroughs in code generation\n- New React frameworks\n- Cloud cost optimization tips', now() - interval '1 day', true, '{INBOX,NEWSLETTER}', 'low', 'Newsletter, no action needed', 'Weekly tech newsletter covering AI, React, and cloud topics.'),

  ('YOUR_USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'gmail', 'msg-004', 'Sarah Chen', 'sarah@legal.co', '{demo@gmail.com}', 'Contract Amendment - URGENT Review', 'The client has requested changes to clause 4.2...', 'Hi,\n\nThe client has requested changes to clause 4.2 of the service agreement. This needs your review before we can proceed with signing.\n\nPlease review ASAP.\n\nSarah', now() - interval '30 minutes', false, '{INBOX,IMPORTANT}', 'high', 'Legal contract requiring urgent review', 'Sarah needs urgent review of contract clause 4.2 amendment before signing.'),

  ('YOUR_USER_ID_HERE', '00000000-0000-0000-0000-000000000001', 'gmail', 'msg-005', 'GitHub', 'notifications@github.com', '{demo@gmail.com}', '[sekpriai] PR #12 merged', 'Your pull request has been merged into main...', 'Your pull request #12 "feat: add inbox list component" has been merged into main.\n\nView on GitHub: https://github.com/...', now() - interval '3 hours', true, '{INBOX}', 'low', 'Automated notification, informational only', 'PR #12 for inbox list component was merged.')
on conflict do nothing;

-- Example: insert a pending memory item
insert into memory_items (user_id, source_message_id, memory_type, content, status, confidence)
select
  'YOUR_USER_ID_HERE',
  id,
  'deadline',
  'Q3 budget review feedback due by Friday',
  'pending',
  0.85
from messages where provider_message_id = 'msg-001' and user_id = 'YOUR_USER_ID_HERE'
on conflict do nothing;
