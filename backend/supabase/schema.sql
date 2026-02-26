-- ============================================================
-- Finance App – Complete Database Schema
-- Firebase Auth (Third-Party JWT) + Supabase
--
-- すべてのユーザー識別子は text 型（Firebase UID）
-- auth.uid() は使用せず、auth.jwt()->>'sub' で Firebase UID を参照する
-- ============================================================
create extension if not exists pgcrypto;
-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'transaction_kind'
) THEN CREATE TYPE public.transaction_kind AS ENUM ('income', 'expense');
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'member_role'
) THEN CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member');
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'budget_period'
) THEN CREATE TYPE public.budget_period AS ENUM ('monthly');
END IF;
END $$;
-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id text not null,
  -- Firebase UID
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id text primary key,
  -- Firebase UID
  display_name text,
  avatar_url text,
  default_household_id uuid references public.households(id) on delete
  set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id text not null,
  -- Firebase UID
  role public.member_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  kind public.transaction_kind not null,
  color text,
  icon text,
  is_system boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, kind, name)
);
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id text not null,
  -- Firebase UID
  category_id uuid not null references public.categories(id) on delete restrict,
  kind public.transaction_kind not null,
  amount bigint not null check (amount > 0),
  transaction_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete
  set null,
    period public.budget_period not null default 'monthly',
    period_start date not null,
    amount bigint not null check (amount > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (household_id, category_id, period, period_start)
);
create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  target_amount bigint not null default 13000000,
  target_year int not null default 2030,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_settings_target_amount_positive check (target_amount >= 0),
  constraint household_settings_target_year_range check (
    target_year between 2025 and 2100
  )
);
create table if not exists public.household_assets (
  household_id uuid primary key references public.households(id) on delete cascade,
  stocks bigint not null default 0,
  funds bigint not null default 0,
  cash bigint not null default 0,
  account bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_assets_non_negative check (
    stocks >= 0
    and funds >= 0
    and cash >= 0
    and account >= 0
  )
);
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  institution_name text not null,
  balance bigint not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_accounts_balance_non_negative check (balance >= 0)
);
create table if not exists public.investment_assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  asset_type text not null default '投資信託',
  name text not null,
  amount bigint not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_assets_amount_non_negative check (amount >= 0)
);
-- ------------------------------------------------------------
-- UUID → text 型変換（既存テーブルに対する冪等マイグレーション）
-- 新規 DB では CREATE TABLE IF NOT EXISTS で最初から text になるため影響なし
-- ------------------------------------------------------------
DO $$ BEGIN -- households.owner_user_id
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'households'
    AND column_name = 'owner_user_id'
    AND data_type = 'uuid'
) THEN DROP POLICY IF EXISTS households_insert_owner ON public.households;
DROP POLICY IF EXISTS households_update_owner ON public.households;
ALTER TABLE public.households DROP CONSTRAINT IF EXISTS households_owner_user_id_fkey;
ALTER TABLE public.households
ALTER COLUMN owner_user_id TYPE text USING owner_user_id::text;
END IF;
-- profiles.id
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'id'
    AND data_type = 'uuid'
) THEN DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
ALTER COLUMN id TYPE text USING id::text;
END IF;
-- household_members.user_id
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'household_members'
    AND column_name = 'user_id'
    AND data_type = 'uuid'
) THEN DROP POLICY IF EXISTS household_members_select_member ON public.household_members;
DROP POLICY IF EXISTS household_members_manage_owner_admin ON public.household_members;
ALTER TABLE public.household_members DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;
ALTER TABLE public.household_members
ALTER COLUMN user_id TYPE text USING user_id::text;
END IF;
-- transactions.user_id
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'transactions'
    AND column_name = 'user_id'
    AND data_type = 'uuid'
) THEN DROP POLICY IF EXISTS transactions_all_member ON public.transactions;
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
DROP POLICY IF EXISTS transactions_insert_own ON public.transactions;
DROP POLICY IF EXISTS transactions_update_own ON public.transactions;
DROP POLICY IF EXISTS transactions_delete_own ON public.transactions;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions
ALTER COLUMN user_id TYPE text USING user_id::text;
END IF;
END $$;
-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists idx_household_members_user_active on public.household_members (user_id, is_active);
create index if not exists idx_categories_household_kind_sort on public.categories (household_id, kind, sort_order);
create index if not exists idx_transactions_household_date on public.transactions (household_id, transaction_date desc);
create index if not exists idx_transactions_household_category_date on public.transactions (household_id, category_id, transaction_date desc);
create index if not exists idx_transactions_household_kind_date on public.transactions (household_id, kind, transaction_date desc);
create index if not exists idx_budgets_household_period_start on public.budgets (household_id, period_start);
create index if not exists idx_household_settings_household_id on public.household_settings (household_id);
create index if not exists idx_household_assets_household_id on public.household_assets (household_id);
create index if not exists idx_bank_accounts_household_id on public.bank_accounts (household_id, sort_order);
create index if not exists idx_investment_assets_household_id on public.investment_assets (household_id, sort_order);
-- ------------------------------------------------------------
-- Functions
-- ------------------------------------------------------------
create or replace function public.set_timestamps() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT'
  and new.created_at is null then new.created_at := now();
end if;
new.updated_at := now();
return new;
end;
$$;
-- JWT 呼び出し元が指定 household のアクティブメンバーかどうかを確認する
create or replace function public.is_household_member(target_household_id uuid) returns boolean language sql stable security definer
set search_path = public as $$
select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = (auth.jwt()->>'sub')
      and hm.is_active = true
  );
$$;
-- 新規 Firebase ユーザー用: household / profile / members / categories / settings / assets を一括作成
create or replace function public.bootstrap_new_user() returns uuid language plpgsql security definer
set search_path = public as $$
declare uid text := auth.jwt()->>'sub';
v_household_id uuid;
display_name text;
begin if uid is null
or uid = '' then raise exception 'Not authenticated';
end if;
-- 既に household を持っていればそれを返す
if exists (
  select 1
  from public.household_members hm
  where hm.user_id = uid
    and hm.is_active = true
) then
select household_id into v_household_id
from public.household_members
where user_id = uid
  and is_active = true
limit 1;
return v_household_id;
end if;
insert into public.households (name, owner_user_id)
values ('マイホーム', uid)
returning id into v_household_id;
display_name := coalesce(auth.jwt()->>'email', uid);
insert into public.profiles (id, display_name, default_household_id)
values (
    uid,
    split_part(display_name, '@', 1),
    v_household_id
  );
insert into public.household_members (household_id, user_id, role)
values (v_household_id, uid, 'owner');
insert into public.categories (
    household_id,
    name,
    kind,
    color,
    is_system,
    sort_order
  )
values (
    v_household_id,
    '食費',
    'expense',
    '#ef4444',
    true,
    10
  ),
  (
    v_household_id,
    '日用品',
    'expense',
    '#f59e0b',
    true,
    20
  ),
  (
    v_household_id,
    '交通費',
    'expense',
    '#3b82f6',
    true,
    30
  ),
  (
    v_household_id,
    '給与',
    'income',
    '#10b981',
    true,
    10
  ),
  (
    v_household_id,
    '副収入',
    'income',
    '#8b5cf6',
    true,
    20
  );
insert into public.household_settings (household_id, target_amount, target_year)
values (v_household_id, 13000000, 2030);
insert into public.household_assets (household_id, stocks, funds, cash, account)
values (v_household_id, 0, 0, 0, 0);
return v_household_id;
end;
$$;
grant execute on function public.bootstrap_new_user() to authenticated;
grant execute on function public.bootstrap_new_user() to anon;
-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------
drop trigger if exists trg_households_timestamps on public.households;
create trigger trg_households_timestamps before
insert
  or
update on public.households for each row execute function public.set_timestamps();
drop trigger if exists trg_profiles_timestamps on public.profiles;
create trigger trg_profiles_timestamps before
insert
  or
update on public.profiles for each row execute function public.set_timestamps();
drop trigger if exists trg_household_members_timestamps on public.household_members;
create trigger trg_household_members_timestamps before
insert
  or
update on public.household_members for each row execute function public.set_timestamps();
drop trigger if exists trg_categories_timestamps on public.categories;
create trigger trg_categories_timestamps before
insert
  or
update on public.categories for each row execute function public.set_timestamps();
drop trigger if exists trg_transactions_timestamps on public.transactions;
create trigger trg_transactions_timestamps before
insert
  or
update on public.transactions for each row execute function public.set_timestamps();
drop trigger if exists trg_budgets_timestamps on public.budgets;
create trigger trg_budgets_timestamps before
insert
  or
update on public.budgets for each row execute function public.set_timestamps();
drop trigger if exists trg_household_settings_timestamps on public.household_settings;
create trigger trg_household_settings_timestamps before
insert
  or
update on public.household_settings for each row execute function public.set_timestamps();
drop trigger if exists trg_household_assets_timestamps on public.household_assets;
create trigger trg_household_assets_timestamps before
insert
  or
update on public.household_assets for each row execute function public.set_timestamps();
drop trigger if exists trg_bank_accounts_timestamps on public.bank_accounts;
create trigger trg_bank_accounts_timestamps before
insert
  or
update on public.bank_accounts for each row execute function public.set_timestamps();
drop trigger if exists trg_investment_assets_timestamps on public.investment_assets;
create trigger trg_investment_assets_timestamps before
insert
  or
update on public.investment_assets for each row execute function public.set_timestamps();
-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.household_settings enable row level security;
alter table public.household_assets enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.investment_assets enable row level security;
-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for
select using (id = (auth.jwt()->>'sub'));
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for
insert with check (id = (auth.jwt()->>'sub'));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for
update using (id = (auth.jwt()->>'sub')) with check (id = (auth.jwt()->>'sub'));
-- households
drop policy if exists households_select_member on public.households;
create policy households_select_member on public.households for
select using (public.is_household_member(id));
drop policy if exists households_insert_owner on public.households;
create policy households_insert_owner on public.households for
insert with check (owner_user_id = (auth.jwt()->>'sub'));
drop policy if exists households_update_owner on public.households;
create policy households_update_owner on public.households for
update using (owner_user_id = (auth.jwt()->>'sub')) with check (owner_user_id = (auth.jwt()->>'sub'));
-- household_members
drop policy if exists household_members_select_member on public.household_members;
create policy household_members_select_member on public.household_members for
select using (public.is_household_member(household_id));
drop policy if exists household_members_manage_owner_admin on public.household_members;
create policy household_members_manage_owner_admin on public.household_members for all using (
  exists (
    select 1
    from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = (auth.jwt()->>'sub')
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
) with check (
  exists (
    select 1
    from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = (auth.jwt()->>'sub')
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
);
-- categories
drop policy if exists categories_all_member on public.categories;
create policy categories_all_member on public.categories for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- transactions
drop policy if exists transactions_all_member on public.transactions;
create policy transactions_all_member on public.transactions for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- budgets
drop policy if exists budgets_all_member on public.budgets;
create policy budgets_all_member on public.budgets for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- household_settings
drop policy if exists household_settings_all_member on public.household_settings;
create policy household_settings_all_member on public.household_settings for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- household_assets
drop policy if exists household_assets_all_member on public.household_assets;
create policy household_assets_all_member on public.household_assets for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- bank_accounts
drop policy if exists bank_accounts_all_member on public.bank_accounts;
create policy bank_accounts_all_member on public.bank_accounts for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- investment_assets
drop policy if exists investment_assets_all_member on public.investment_assets;
create policy investment_assets_all_member on public.investment_assets for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));