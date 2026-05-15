-- Per-conversation read cursor for DM notifications (unread counts).
-- Run after 0012.

create table if not exists public.community_dm_read_cursors (
  user_id uuid not null references public.users (id) on delete cascade,
  peer_id uuid not null references public.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, peer_id),
  constraint community_dm_read_cursors_no_self check (user_id <> peer_id)
);

create index if not exists community_dm_read_cursors_user_idx
  on public.community_dm_read_cursors (user_id);

alter table public.community_dm_read_cursors enable row level security;

drop policy if exists "community_dm_read_cursors_select_own" on public.community_dm_read_cursors;
drop policy if exists "community_dm_read_cursors_insert_own" on public.community_dm_read_cursors;
drop policy if exists "community_dm_read_cursors_update_own" on public.community_dm_read_cursors;

create policy "community_dm_read_cursors_select_own"
  on public.community_dm_read_cursors
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "community_dm_read_cursors_insert_own"
  on public.community_dm_read_cursors
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "community_dm_read_cursors_update_own"
  on public.community_dm_read_cursors
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
