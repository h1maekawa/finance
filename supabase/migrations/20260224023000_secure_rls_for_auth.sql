-- Re-enable secure RLS for authenticated usage (Supabase Auth)

alter table public.household_settings enable row level security;
alter table public.household_assets enable row level security;

drop policy if exists household_settings_all_public on public.household_settings;
drop policy if exists household_assets_all_public on public.household_assets;

create policy household_settings_all_member on public.household_settings
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy household_assets_all_member on public.household_assets
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
