-- Mutual "network" (connection requests + accepted pairs) and feed ordering that
-- prioritizes posts from people you follow. Run after 0009.

-- ---------------------------------------------------------------------------
-- Network requests (addressee must accept before a mutual edge exists)
-- ---------------------------------------------------------------------------
create table if not exists public.community_network_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users (id) on delete cascade,
  addressee_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint community_network_requests_no_self check (requester_id <> addressee_id)
);

create unique index if not exists community_network_requests_one_pending_pair
  on public.community_network_requests (requester_id, addressee_id)
  where status = 'pending';

create index if not exists community_network_requests_addressee_pending_idx
  on public.community_network_requests (addressee_id)
  where status = 'pending';

create index if not exists community_network_requests_requester_idx
  on public.community_network_requests (requester_id);

-- ---------------------------------------------------------------------------
-- Mutual network edges (unordered pair: user_a < user_b)
-- ---------------------------------------------------------------------------
create table if not exists public.community_network_edges (
  user_a uuid not null references public.users (id) on delete cascade,
  user_b uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_network_edges_ordered check (user_a < user_b),
  primary key (user_a, user_b)
);

create index if not exists community_network_edges_user_a_idx
  on public.community_network_edges (user_a);

create index if not exists community_network_edges_user_b_idx
  on public.community_network_edges (user_b);

-- When a request is accepted, create the mutual edge (SECURITY DEFINER bypasses RLS on insert).
create or replace function public.trg_community_network_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.status = 'accepted'
     and old.status is distinct from new.status
  then
    insert into public.community_network_edges (user_a, user_b)
    values (
      least(new.requester_id, new.addressee_id),
      greatest(new.requester_id, new.addressee_id)
    )
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists community_network_request_accepted_edge on public.community_network_requests;
create trigger community_network_request_accepted_edge
  after update of status on public.community_network_requests
  for each row
  execute procedure public.trg_community_network_request_accepted();

create or replace function public.trg_community_network_request_responded_at()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('accepted', 'declined', 'cancelled')
     and old.status = 'pending'
  then
    new.responded_at := coalesce(new.responded_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists community_network_request_responded_at on public.community_network_requests;
create trigger community_network_request_responded_at
  before update of status on public.community_network_requests
  for each row
  execute procedure public.trg_community_network_request_responded_at();

-- Feed ordering (people you follow first) is implemented in the app by fetching a
-- larger window and sorting, so no SQL function is required here.

-- ---------------------------------------------------------------------------
-- RLS: community_network_requests
-- ---------------------------------------------------------------------------
alter table public.community_network_requests enable row level security;

drop policy if exists "community_network_requests_select" on public.community_network_requests;
drop policy if exists "community_network_requests_insert" on public.community_network_requests;
drop policy if exists "community_network_requests_update_addressee" on public.community_network_requests;
drop policy if exists "community_network_requests_update_requester_cancel" on public.community_network_requests;

create policy "community_network_requests_select"
  on public.community_network_requests
  for select
  to authenticated
  using (
    (requester_id = auth.uid() or addressee_id = auth.uid())
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = requester_id and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u where u.id = addressee_id and u.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = requester_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = addressee_id and u.org_id is null)
      )
    )
  );

create policy "community_network_requests_insert"
  on public.community_network_requests
  for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = addressee_id and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = addressee_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id is null)
      )
    )
  );

create policy "community_network_requests_update_addressee"
  on public.community_network_requests
  for update
  to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (
    addressee_id = auth.uid()
    and status in ('accepted', 'declined')
  );

create policy "community_network_requests_update_requester_cancel"
  on public.community_network_requests
  for update
  to authenticated
  using (requester_id = auth.uid() and status = 'pending')
  with check (requester_id = auth.uid() and status = 'cancelled');

-- ---------------------------------------------------------------------------
-- RLS: community_network_edges (read-only for members; writes via trigger only)
-- ---------------------------------------------------------------------------
alter table public.community_network_edges enable row level security;

drop policy if exists "community_network_edges_select" on public.community_network_edges;

create policy "community_network_edges_select"
  on public.community_network_edges
  for select
  to authenticated
  using (
    auth.uid() in (user_a, user_b)
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = user_a and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u where u.id = user_b and u.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = user_a and u.org_id is null)
        and exists (select 1 from public.users u where u.id = user_b and u.org_id is null)
      )
    )
  );
