-- ============================================================
-- Add Gmail Sync Filters for Automated Reflection
-- ============================================================

create table if not exists public.gmail_sync_filters (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Firebase UID (text in this schema)
  sender_email text not null,
  subject_filter text,
  template_type text not null default 'generic', -- smbc, rakuten, seven_eleven, generic
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.gmail_sync_filters enable row level security;

-- Policies
create policy gmail_sync_filters_manage_own on public.gmail_sync_filters
  for all using (user_id = (auth.jwt()->>'sub'))
  with check (user_id = (auth.jwt()->>'sub'));

-- Trigger for timestamps
create trigger trg_gmail_sync_filters_timestamps before
insert
  or
update on public.gmail_sync_filters for each row execute function public.set_timestamps();

-- Index
create index if not exists idx_gmail_sync_filters_user on public.gmail_sync_filters (user_id, is_active);
