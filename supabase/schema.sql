-- LifeHub sync: run once in Supabase → SQL Editor → Run
-- Project: https://supabase.com/dashboard/project/hhfxqdtedazfbjjrwdaq

create table if not exists public.lifehub_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lifehub_snapshots enable row level security;

drop policy if exists "lifehub_snapshots_select_own" on public.lifehub_snapshots;
drop policy if exists "lifehub_snapshots_insert_own" on public.lifehub_snapshots;
drop policy if exists "lifehub_snapshots_update_own" on public.lifehub_snapshots;
drop policy if exists "lifehub_snapshots_delete_own" on public.lifehub_snapshots;

create policy "lifehub_snapshots_select_own"
  on public.lifehub_snapshots for select
  using (auth.uid() = user_id);

create policy "lifehub_snapshots_insert_own"
  on public.lifehub_snapshots for insert
  with check (auth.uid() = user_id);

create policy "lifehub_snapshots_update_own"
  on public.lifehub_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lifehub_snapshots_delete_own"
  on public.lifehub_snapshots for delete
  using (auth.uid() = user_id);
