-- Firebase Auth (Third-Party JWT) compatibility migration
-- Goal:
-- 1) user identifier columns become text (Firebase uid)
-- 2) remove FK dependency on auth.users
-- 3) RLS uses auth.jwt()->>'sub'

-- Drop FK constraints if they exist
alter table if exists public.profiles drop constraint if exists profiles_id_fkey;
alter table if exists public.categories drop constraint if exists categories_user_id_fkey;
alter table if exists public.transactions drop constraint if exists transactions_user_id_fkey;

-- Convert identifiers from uuid -> text
alter table if exists public.profiles
  alter column id type text using id::text;

alter table if exists public.categories
  alter column user_id type text using user_id::text;

alter table if exists public.transactions
  alter column user_id type text using user_id::text;

-- Stop relying on auth.users trigger for profile bootstrap
-- (Firebase auth does not insert rows into auth.users)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Ensure RLS is enabled
alter table if exists public.profiles enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.transactions enable row level security;

-- Recreate policies based on JWT sub claim
-- profiles
 drop policy if exists profiles_select_own on public.profiles;
 drop policy if exists profiles_insert_own on public.profiles;
 drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
for select using (id = (auth.jwt()->>'sub'));

create policy profiles_insert_own on public.profiles
for insert with check (id = (auth.jwt()->>'sub'));

create policy profiles_update_own on public.profiles
for update using (id = (auth.jwt()->>'sub')) with check (id = (auth.jwt()->>'sub'));

-- categories
 drop policy if exists categories_select_own on public.categories;
 drop policy if exists categories_insert_own on public.categories;
 drop policy if exists categories_update_own on public.categories;
 drop policy if exists categories_delete_own on public.categories;

create policy categories_select_own on public.categories
for select using (user_id = (auth.jwt()->>'sub'));

create policy categories_insert_own on public.categories
for insert with check (user_id = (auth.jwt()->>'sub'));

create policy categories_update_own on public.categories
for update using (user_id = (auth.jwt()->>'sub')) with check (user_id = (auth.jwt()->>'sub'));

create policy categories_delete_own on public.categories
for delete using (user_id = (auth.jwt()->>'sub'));

-- transactions
 drop policy if exists transactions_select_own on public.transactions;
 drop policy if exists transactions_insert_own on public.transactions;
 drop policy if exists transactions_update_own on public.transactions;
 drop policy if exists transactions_delete_own on public.transactions;

create policy transactions_select_own on public.transactions
for select using (user_id = (auth.jwt()->>'sub'));

create policy transactions_insert_own on public.transactions
for insert with check (
  user_id = (auth.jwt()->>'sub')
  and (
    category_id is null
    or exists (
      select 1
      from public.categories c
      where c.id = category_id
        and c.user_id = (auth.jwt()->>'sub')
    )
  )
);

create policy transactions_update_own on public.transactions
for update using (user_id = (auth.jwt()->>'sub'))
with check (
  user_id = (auth.jwt()->>'sub')
  and (
    category_id is null
    or exists (
      select 1
      from public.categories c
      where c.id = category_id
        and c.user_id = (auth.jwt()->>'sub')
    )
  )
);

create policy transactions_delete_own on public.transactions
for delete using (user_id = (auth.jwt()->>'sub'));
