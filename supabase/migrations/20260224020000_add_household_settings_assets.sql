create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  target_amount bigint not null default 13000000,
  target_year int not null default 2030,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_settings_target_amount_positive check (target_amount >= 0),
  constraint household_settings_target_year_range check (target_year between 2025 and 2100)
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
    stocks >= 0 and funds >= 0 and cash >= 0 and account >= 0
  )
);

create index if not exists idx_household_settings_household_id
  on public.household_settings (household_id);

create index if not exists idx_household_assets_household_id
  on public.household_assets (household_id);

-- timestamp trigger function is created in the initial migration

drop trigger if exists trg_household_settings_timestamps on public.household_settings;
create trigger trg_household_settings_timestamps
before insert or update on public.household_settings
for each row execute function public.set_timestamps();

drop trigger if exists trg_household_assets_timestamps on public.household_assets;
create trigger trg_household_assets_timestamps
before insert or update on public.household_assets
for each row execute function public.set_timestamps();

alter table public.household_settings enable row level security;
alter table public.household_assets enable row level security;

-- NOTE:
-- 現在はログイン機能を外しているため、匿名キーから更新できる暫定ポリシー
-- 認証再導入時は household membership ベースに戻すこと

drop policy if exists household_settings_all_public on public.household_settings;
create policy household_settings_all_public on public.household_settings
for all
using (true)
with check (true);

drop policy if exists household_assets_all_public on public.household_assets;
create policy household_assets_all_public on public.household_assets
for all
using (true)
with check (true);
