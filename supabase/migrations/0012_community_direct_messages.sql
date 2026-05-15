-- Direct messages between users who share a mutual network edge (community_network_edges).
-- Run after 0010.

create table if not exists public.community_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_direct_messages_no_self check (sender_id <> recipient_id),
  constraint community_direct_messages_body_len check (char_length(body) between 1 and 4000)
);

create index if not exists community_direct_messages_pair_created_idx
  on public.community_direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

create index if not exists community_direct_messages_recipient_created_idx
  on public.community_direct_messages (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.community_direct_messages enable row level security;

drop policy if exists "community_direct_messages_select" on public.community_direct_messages;
drop policy if exists "community_direct_messages_insert" on public.community_direct_messages;
drop policy if exists "community_direct_messages_delete_own" on public.community_direct_messages;

create policy "community_direct_messages_select"
  on public.community_direct_messages
  for select
  to authenticated
  using (
    (sender_id = auth.uid() or recipient_id = auth.uid())
    and exists (
      select 1
      from public.community_network_edges e
      where e.user_a = least(sender_id, recipient_id)
        and e.user_b = greatest(sender_id, recipient_id)
    )
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = sender_id and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u2 where u2.id = recipient_id and u2.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = sender_id and u.org_id is null)
        and exists (select 1 from public.users u2 where u2.id = recipient_id and u2.org_id is null)
      )
    )
  );

create policy "community_direct_messages_insert"
  on public.community_direct_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.community_network_edges e
      where e.user_a = least(sender_id, recipient_id)
        and e.user_b = greatest(sender_id, recipient_id)
    )
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = recipient_id and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = recipient_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id is null)
      )
    )
  );

create policy "community_direct_messages_delete_own"
  on public.community_direct_messages
  for delete
  to authenticated
  using (sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime (Supabase): broadcast inserts to participants who pass RLS
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_direct_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.community_direct_messages';
  end if;
end $$;
