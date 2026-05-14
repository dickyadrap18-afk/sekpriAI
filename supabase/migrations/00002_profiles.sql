-- Phase 2: Profiles table
-- Ref: specs/004-erd.md §3

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;

create policy "owner can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "owner can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "owner can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "owner can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
