create extension if not exists pgcrypto;

create schema if not exists app;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_kind') THEN
    CREATE TYPE public.transaction_kind AS ENUM ('income', 'expense');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_period') THEN
    CREATE TYPE public.budget_period AS ENUM ('monthly');
  END IF;
END $$;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_household_id uuid references public.households(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete restrict,
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
  category_id uuid references public.categories(id) on delete set null,
  period public.budget_period not null default 'monthly',
  period_start date not null,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, category_id, period, period_start)
);

create index if not exists idx_household_members_user_active
  on public.household_members (user_id, is_active);

create index if not exists idx_categories_household_kind_sort
  on public.categories (household_id, kind, sort_order);

create index if not exists idx_transactions_household_date
  on public.transactions (household_id, transaction_date desc);

create index if not exists idx_transactions_household_category_date
  on public.transactions (household_id, category_id, transaction_date desc);

create index if not exists idx_transactions_household_kind_date
  on public.transactions (household_id, kind, transaction_date desc);

create index if not exists idx_budgets_household_period_start
  on public.budgets (household_id, period_start);

create or replace function public.set_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.created_at is null then
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

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
      and hm.user_id = auth.uid()
      and hm.is_active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  insert into public.households (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'name', 'My Household'), new.id)
  returning id into v_household_id;

  insert into public.profiles (id, display_name, default_household_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_household_id
  );

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, new.id, 'owner');

  insert into public.categories (household_id, name, kind, color, is_system, sort_order)
  values
    (v_household_id, '食費', 'expense', '#ef4444', true, 10),
    (v_household_id, '日用品', 'expense', '#f59e0b', true, 20),
    (v_household_id, '交通費', 'expense', '#3b82f6', true, 30),
    (v_household_id, '給与', 'income', '#10b981', true, 10),
    (v_household_id, '副収入', 'income', '#8b5cf6', true, 20);

  return new;
end;
$$;

drop trigger if exists trg_households_timestamps on public.households;
create trigger trg_households_timestamps
before insert or update on public.households
for each row execute function public.set_timestamps();

drop trigger if exists trg_profiles_timestamps on public.profiles;
create trigger trg_profiles_timestamps
before insert or update on public.profiles
for each row execute function public.set_timestamps();

drop trigger if exists trg_household_members_timestamps on public.household_members;
create trigger trg_household_members_timestamps
before insert or update on public.household_members
for each row execute function public.set_timestamps();

drop trigger if exists trg_categories_timestamps on public.categories;
create trigger trg_categories_timestamps
before insert or update on public.categories
for each row execute function public.set_timestamps();

drop trigger if exists trg_transactions_timestamps on public.transactions;
create trigger trg_transactions_timestamps
before insert or update on public.transactions
for each row execute function public.set_timestamps();

drop trigger if exists trg_budgets_timestamps on public.budgets;
create trigger trg_budgets_timestamps
before insert or update on public.budgets
for each row execute function public.set_timestamps();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- profiles
create policy if not exists profiles_select_own on public.profiles
for select using (id = auth.uid());

create policy if not exists profiles_insert_own on public.profiles
for insert with check (id = auth.uid());

create policy if not exists profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- households
create policy if not exists households_select_member on public.households
for select using (public.is_household_member(id));

create policy if not exists households_insert_owner on public.households
for insert with check (owner_user_id = auth.uid());

create policy if not exists households_update_owner on public.households
for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- household members
create policy if not exists household_members_select_member on public.household_members
for select using (public.is_household_member(household_id));

create policy if not exists household_members_manage_owner_admin on public.household_members
for all
using (
  exists (
    select 1 from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = auth.uid()
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.household_members me
    where me.household_id = household_members.household_id
      and me.user_id = auth.uid()
      and me.is_active = true
      and me.role in ('owner', 'admin')
  )
);

-- categories
create policy if not exists categories_all_member on public.categories
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- transactions
create policy if not exists transactions_all_member on public.transactions
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- budgets
create policy if not exists budgets_all_member on public.budgets
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
