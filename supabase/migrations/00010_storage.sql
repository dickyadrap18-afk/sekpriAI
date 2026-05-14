-- Phase 2: Storage bucket for attachments
-- Ref: specs/004-erd.md §5
-- Note: This migration creates the bucket via SQL.
-- On Supabase hosted, you may need to create it via the dashboard instead.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Storage RLS policies: owner can read/write their own files
-- Object key pattern: attachments/{user_id}/{message_id}/{filename}

create policy "owner can upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner can read own attachments"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner can delete own attachments"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
