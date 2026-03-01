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
IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'notification_provider'
) THEN CREATE TYPE public.notification_provider AS ENUM ('line');
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'notification_status'
) THEN CREATE TYPE public.notification_status AS ENUM ('sent', 'failed');
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
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  card_name text not null,
  brand text,
  last4 text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.securities_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  broker_name text not null,
  account_name text not null,
  tax_category text not null check (
    tax_category in ('nisa_growth', 'nisa_tsumitate', 'specified', 'general')
  ),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, broker_name, account_name, tax_category)
);
create table if not exists public.investment_assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  asset_type text not null default '投資信託',
  name text not null,
  amount bigint not null default 0,
  ticker text,
  quantity numeric(20, 6) not null default 0,
  avg_cost numeric(20, 6),
  take_profit_price numeric(20, 6),
  notify_take_profit boolean not null default false,
  last_notified_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_assets_amount_non_negative check (amount >= 0),
  constraint investment_assets_quantity_non_negative check (quantity >= 0)
);
create table if not exists public.stocks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  symbol text not null,
  instrument_type text not null default 'stock' check (
    instrument_type in ('stock', 'fund', 'etf')
  ),
  account_type text not null default '特定口座',
  shares numeric(20, 6) not null default 0,
  average_price numeric(20, 6) not null default 0,
  current_price numeric(20, 6) not null default 0,
  evaluation_amount numeric(20, 6) not null default 0,
  profit_loss numeric(20, 6) not null default 0,
  profit_loss_rate numeric(10, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint stocks_shares_non_negative check (shares >= 0),
  constraint stocks_average_price_non_negative check (average_price >= 0)
);
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('stock', 'fund')),
  symbol text not null,
  name text not null,
  account_type text not null default '未設定',
  quantity numeric(20, 6) not null default 0,
  average_price numeric(20, 6) not null default 0,
  current_price numeric(20, 6) not null default 0,
  evaluation_amount numeric(20, 6) not null default 0,
  profit_loss numeric(20, 6) not null default 0,
  profit_loss_rate numeric(10, 4) not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint investments_quantity_non_negative check (quantity >= 0),
  constraint investments_average_price_non_negative check (average_price >= 0)
);
create table if not exists public.user_notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider public.notification_provider not null default 'line',
  line_user_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  household_id uuid references public.households(id) on delete set null,
  investment_asset_id uuid references public.investment_assets(id) on delete set null,
  provider public.notification_provider not null default 'line',
  status public.notification_status not null,
  message text not null,
  payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);
create table if not exists public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  target_month date not null,
  income_total bigint not null default 0,
  expense_total bigint not null default 0,
  net_total bigint not null default 0,
  month_end_assets bigint not null default 0,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, target_month)
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
-- investment_assets 追加カラム（既存DB向け）
alter table public.investment_assets add column if not exists ticker text;
alter table public.investment_assets add column if not exists quantity numeric(20, 6) not null default 0;
alter table public.investment_assets add column if not exists avg_cost numeric(20, 6);
alter table public.investment_assets add column if not exists take_profit_price numeric(20, 6);
alter table public.investment_assets add column if not exists notify_take_profit boolean not null default false;
alter table public.investment_assets add column if not exists last_notified_at timestamptz;
do $$ begin
if not exists (
  select 1
  from pg_constraint
  where conname = 'investment_assets_quantity_non_negative'
) then
  alter table public.investment_assets
    add constraint investment_assets_quantity_non_negative check (quantity >= 0);
end if;
end $$;
-- stocks から investments への移行（既存DB向け）
do $$ begin
if exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'stocks'
) then
  insert into public.investments (
    user_id,
    type,
    symbol,
    name,
    account_type,
    quantity,
    average_price,
    current_price,
    evaluation_amount,
    profit_loss,
    profit_loss_rate,
    updated_at,
    created_at
  )
  select
    s.user_id,
    case when s.instrument_type = 'stock' then 'stock' else 'fund' end as type,
    s.symbol,
    s.symbol as name,
    coalesce(s.account_type, '未設定'),
    coalesce(s.shares, 0),
    coalesce(s.average_price, 0),
    coalesce(s.current_price, 0),
    coalesce(s.evaluation_amount, 0),
    coalesce(s.profit_loss, 0),
    coalesce(s.profit_loss_rate, 0),
    coalesce(s.updated_at, now()),
    coalesce(s.created_at, now())
  from public.stocks s
  where not exists (
    select 1
    from public.investments i
    where i.user_id = s.user_id
      and i.symbol = s.symbol
      and i.account_type = coalesce(s.account_type, '未設定')
      and i.type = case when s.instrument_type = 'stock' then 'stock' else 'fund' end
  );
end if;
end $$;
-- stocks 銘柄種別追加（既存DB向け）
alter table public.stocks add column if not exists instrument_type text not null default 'stock';
do $$ begin
if not exists (
  select 1
  from pg_constraint
  where conname = 'stocks_instrument_type_check'
) then
  alter table public.stocks
    add constraint stocks_instrument_type_check
    check (instrument_type in ('stock', 'fund', 'etf'));
end if;
end $$;
-- transactions 支払手段（クレジットカード）追加
alter table public.transactions add column if not exists credit_card_id uuid;
do $$ begin
if not exists (
  select 1
  from pg_constraint
  where conname = 'transactions_credit_card_id_fkey'
) then
  alter table public.transactions
    add constraint transactions_credit_card_id_fkey
    foreign key (credit_card_id) references public.credit_cards(id) on delete set null;
end if;
end $$;
-- stocks 証券口座追加
alter table public.stocks add column if not exists securities_account_id uuid;
do $$ begin
if not exists (
  select 1
  from pg_constraint
  where conname = 'stocks_securities_account_id_fkey'
) then
  alter table public.stocks
    add constraint stocks_securities_account_id_fkey
    foreign key (securities_account_id) references public.securities_accounts(id) on delete set null;
end if;
end $$;
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
create index if not exists idx_credit_cards_household_id on public.credit_cards (household_id, sort_order);
create index if not exists idx_securities_accounts_household_id on public.securities_accounts (household_id, sort_order);
create index if not exists idx_investment_assets_household_id on public.investment_assets (household_id, sort_order);
create index if not exists idx_investment_assets_household_ticker on public.investment_assets (household_id, ticker);
create index if not exists idx_investment_assets_notify_tp on public.investment_assets (household_id, notify_take_profit);
create index if not exists idx_stocks_user_symbol on public.stocks (user_id, symbol);
create index if not exists idx_investments_user_type_symbol on public.investments (user_id, type, symbol);
create index if not exists idx_investments_user_updated_at on public.investments (user_id, updated_at desc);
create index if not exists idx_user_notification_channels_user on public.user_notification_channels (user_id, provider, is_active);
create index if not exists idx_notification_logs_user_created on public.notification_logs (user_id, created_at desc);
create index if not exists idx_monthly_snapshots_household_month on public.monthly_snapshots (household_id, target_month desc);
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
drop trigger if exists trg_credit_cards_timestamps on public.credit_cards;
create trigger trg_credit_cards_timestamps before
insert
  or
update on public.credit_cards for each row execute function public.set_timestamps();
drop trigger if exists trg_securities_accounts_timestamps on public.securities_accounts;
create trigger trg_securities_accounts_timestamps before
insert
  or
update on public.securities_accounts for each row execute function public.set_timestamps();
drop trigger if exists trg_investment_assets_timestamps on public.investment_assets;
create trigger trg_investment_assets_timestamps before
insert
  or
update on public.investment_assets for each row execute function public.set_timestamps();
drop trigger if exists trg_stocks_timestamps on public.stocks;
create trigger trg_stocks_timestamps before
insert
  or
update on public.stocks for each row execute function public.set_timestamps();
drop trigger if exists trg_investments_timestamps on public.investments;
create trigger trg_investments_timestamps before
insert
  or
update on public.investments for each row execute function public.set_timestamps();
drop trigger if exists trg_user_notification_channels_timestamps on public.user_notification_channels;
create trigger trg_user_notification_channels_timestamps before
insert
  or
update on public.user_notification_channels for each row execute function public.set_timestamps();
drop trigger if exists trg_monthly_snapshots_timestamps on public.monthly_snapshots;
create trigger trg_monthly_snapshots_timestamps before
insert
  or
update on public.monthly_snapshots for each row execute function public.set_timestamps();
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
alter table public.credit_cards enable row level security;
alter table public.securities_accounts enable row level security;
alter table public.investment_assets enable row level security;
alter table public.stocks enable row level security;
alter table public.investments enable row level security;
alter table public.user_notification_channels enable row level security;
alter table public.notification_logs enable row level security;
alter table public.monthly_snapshots enable row level security;
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
-- credit_cards
drop policy if exists credit_cards_all_member on public.credit_cards;
create policy credit_cards_all_member on public.credit_cards for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- securities_accounts
drop policy if exists securities_accounts_all_member on public.securities_accounts;
create policy securities_accounts_all_member on public.securities_accounts for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- investment_assets
drop policy if exists investment_assets_all_member on public.investment_assets;
create policy investment_assets_all_member on public.investment_assets for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- stocks
drop policy if exists stocks_select_own on public.stocks;
create policy stocks_select_own on public.stocks for
select using (user_id = (auth.jwt()->>'sub'));
drop policy if exists stocks_insert_own on public.stocks;
create policy stocks_insert_own on public.stocks for
insert with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists stocks_update_own on public.stocks;
create policy stocks_update_own on public.stocks for
update using (user_id = (auth.jwt()->>'sub')) with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists stocks_delete_own on public.stocks;
create policy stocks_delete_own on public.stocks for
delete using (user_id = (auth.jwt()->>'sub'));
-- investments
drop policy if exists investments_select_own on public.investments;
create policy investments_select_own on public.investments for
select using (user_id = (auth.jwt()->>'sub'));
drop policy if exists investments_insert_own on public.investments;
create policy investments_insert_own on public.investments for
insert with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists investments_update_own on public.investments;
create policy investments_update_own on public.investments for
update using (user_id = (auth.jwt()->>'sub')) with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists investments_delete_own on public.investments;
create policy investments_delete_own on public.investments for
delete using (user_id = (auth.jwt()->>'sub'));
-- user_notification_channels
drop policy if exists user_notification_channels_select_own on public.user_notification_channels;
create policy user_notification_channels_select_own on public.user_notification_channels for
select using (user_id = (auth.jwt()->>'sub'));
drop policy if exists user_notification_channels_insert_own on public.user_notification_channels;
create policy user_notification_channels_insert_own on public.user_notification_channels for
insert with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists user_notification_channels_update_own on public.user_notification_channels;
create policy user_notification_channels_update_own on public.user_notification_channels for
update using (user_id = (auth.jwt()->>'sub')) with check (user_id = (auth.jwt()->>'sub'));
drop policy if exists user_notification_channels_delete_own on public.user_notification_channels;
create policy user_notification_channels_delete_own on public.user_notification_channels for
delete using (user_id = (auth.jwt()->>'sub'));
-- notification_logs
drop policy if exists notification_logs_select_own on public.notification_logs;
create policy notification_logs_select_own on public.notification_logs for
select using (user_id = (auth.jwt()->>'sub'));
-- monthly_snapshots
drop policy if exists monthly_snapshots_all_member on public.monthly_snapshots;
create policy monthly_snapshots_all_member on public.monthly_snapshots for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
