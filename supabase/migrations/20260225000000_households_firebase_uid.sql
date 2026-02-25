-- households / household_members を Firebase uid (text) に対応
-- RLS は auth.jwt()->>'sub' を使用。新規ユーザー用に bootstrap_new_user RPC を追加。

-- FK を外して user_id を text に
alter table if exists public.households drop constraint if exists households_owner_user_id_fkey;
alter table if exists public.household_members drop constraint if exists household_members_user_id_fkey;

alter table if exists public.households
  alter column owner_user_id type text using owner_user_id::text;

alter table if exists public.household_members
  alter column user_id type text using user_id::text;

-- is_household_member: auth.uid() → auth.jwt()->>'sub'
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = (auth.jwt()->>'sub')
      and hm.is_active = true
  );
$$;

-- households ポリシーを JWT sub ベースに
drop policy if exists households_insert_owner on public.households;
drop policy if exists households_update_owner on public.households;

create policy households_insert_owner on public.households
for insert with check (owner_user_id = (auth.jwt()->>'sub'));

create policy households_update_owner on public.households
for update using (owner_user_id = (auth.jwt()->>'sub')) with check (owner_user_id = (auth.jwt()->>'sub'));

-- household_members ポリシーを JWT sub ベースに
drop policy if exists household_members_manage_owner_admin on public.household_members;

create policy household_members_manage_owner_admin on public.household_members
for all
using (
  exists (
    select 1 from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = (auth.jwt()->>'sub')
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = (auth.jwt()->>'sub')
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
);

-- Firebase 新規ユーザー用: 1 household + profile + member + デフォルトカテゴリ + settings/assets を作成
create or replace function public.bootstrap_new_user()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := auth.jwt()->>'sub';
  v_household_id uuid;
  display_name text;
begin
  if uid is null or uid = '' then
    raise exception 'Not authenticated';
  end if;

  -- 既に household を持っていれば何もしない
  if exists (
    select 1 from public.household_members hm
    where hm.user_id = uid and hm.is_active = true
  ) then
    select household_id into v_household_id
    from public.household_members
    where user_id = uid and is_active = true
    limit 1;
    return v_household_id;
  end if;

  insert into public.households (name, owner_user_id)
  values ('マイホーム', uid)
  returning id into v_household_id;

  display_name := coalesce(auth.jwt()->>'email', uid);
  insert into public.profiles (id, display_name, default_household_id)
  values (uid, split_part(display_name, '@', 1), v_household_id);

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, uid, 'owner');

  insert into public.categories (household_id, name, kind, color, is_system, sort_order)
  values
    (v_household_id, '食費', 'expense', '#ef4444', true, 10),
    (v_household_id, '日用品', 'expense', '#f59e0b', true, 20),
    (v_household_id, '交通費', 'expense', '#3b82f6', true, 30),
    (v_household_id, '給与', 'income', '#10b981', true, 10),
    (v_household_id, '副収入', 'income', '#8b5cf6', true, 20);

  insert into public.household_settings (household_id, target_amount, target_year)
  values (v_household_id, 13000000, 2030);

  insert into public.household_assets (household_id, stocks, funds, cash, account)
  values (v_household_id, 0, 0, 0, 0);

  return v_household_id;
end;
$$;

-- RPC は JWT 付きリクエストのみ（anon は不可にする場合は RLS で制御）
grant execute on function public.bootstrap_new_user() to authenticated;
grant execute on function public.bootstrap_new_user() to anon;
