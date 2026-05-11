-- ============================================================
-- Gmail Sync Extension for Finance App
-- ============================================================

-- Table to manage email sync filters
create table if not exists public.gmail_sync_filters (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Firebase UID
  sender_email text not null,
  subject_filter text,
  template_type text not null default 'generic', -- smbc, rakuten, seven_eleven, generic
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table to log sync results
create table if not exists public.email_import_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  user_id text not null,
  imported_count int not null default 0,
  status text not null default 'success', -- success, partial_success, failed
  error_message text,
  imported_at timestamptz not null default now()
);

-- Add metadata to transactions to track origin
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='transactions' and column_name='import_source') then
    alter table public.transactions add column import_source text default 'manual'; -- manual, gmail
  end if;
  if not exists (select 1 from information_schema.columns where table_name='transactions' and column_name='external_id') then
    alter table public.transactions add column external_id text; -- Gmail message ID for deduplication
  end if;
end $$;

-- RLS
alter table public.gmail_sync_filters enable row level security;
alter table public.email_import_logs enable row level security;

create policy gmail_sync_filters_manage_own on public.gmail_sync_filters
  for all using (user_id = (auth.jwt()->>'sub'))
  with check (user_id = (auth.jwt()->>'sub'));

create policy email_import_logs_view_own on public.email_import_logs
  for select using (user_id = (auth.jwt()->>'sub'));

-- Index
create index if not exists idx_transactions_external_id on public.transactions (external_id);
create index if not exists idx_email_import_logs_household on public.email_import_logs (household_id, imported_at desc);
