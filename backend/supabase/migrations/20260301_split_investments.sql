-- 2026-03-01: investments テーブル導入（stock/fund 分離）
-- NOTE: 現在の実装は Firebase UID 運用のため user_id は text。

create extension if not exists pgcrypto;

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

create index if not exists idx_investments_user_type_symbol
  on public.investments (user_id, type, symbol);
create index if not exists idx_investments_user_updated_at
  on public.investments (user_id, updated_at desc);

-- 既存 stocks から移行（存在する場合のみ）
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'stocks'
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
      case when coalesce(s.instrument_type, 'stock') = 'stock' then 'stock' else 'fund' end as type,
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
        and i.type = case when coalesce(s.instrument_type, 'stock') = 'stock' then 'stock' else 'fund' end
    );
  end if;
end
$$;

-- set_timestamps 関数が無ければ作成
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

drop trigger if exists trg_investments_timestamps on public.investments;
create trigger trg_investments_timestamps
before insert or update on public.investments
for each row execute function public.set_timestamps();

alter table public.investments enable row level security;

drop policy if exists investments_select_own on public.investments;
create policy investments_select_own
on public.investments
for select
using (user_id = (auth.jwt()->>'sub'));

drop policy if exists investments_insert_own on public.investments;
create policy investments_insert_own
on public.investments
for insert
with check (user_id = (auth.jwt()->>'sub'));

drop policy if exists investments_update_own on public.investments;
create policy investments_update_own
on public.investments
for update
using (user_id = (auth.jwt()->>'sub'))
with check (user_id = (auth.jwt()->>'sub'));

drop policy if exists investments_delete_own on public.investments;
create policy investments_delete_own
on public.investments
for delete
using (user_id = (auth.jwt()->>'sub'));
