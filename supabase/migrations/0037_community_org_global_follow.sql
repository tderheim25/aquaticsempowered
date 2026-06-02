-- Allow facility (org) members to follow and read global (org-less) community members.
-- Matches app feed/profile partition: org feed includes org_id IS NULL posts.

-- ---------------------------------------------------------------------------
-- users: org members can read global community members
-- ---------------------------------------------------------------------------
drop policy if exists "users_select_self_or_same_org_or_super" on public.users;

create policy "users_select_self_or_same_org_or_super" on public.users
  for select
  using (
    public.current_role() = 'super_admin'
    or id = auth.uid()
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
    or (
      public.current_org_id() is not null
      and org_id is null
    )
    or (
      public.current_org_id() is null
      and org_id is null
    )
  );

-- ---------------------------------------------------------------------------
-- community_profiles: org members can read global profiles
-- ---------------------------------------------------------------------------
drop policy if exists "community_profiles_select_org" on public.community_profiles;

create policy "community_profiles_select_org"
  on public.community_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = community_profiles.user_id
        and (
          public.current_role() = 'super_admin'
          or u.id = auth.uid()
          or (
            public.current_org_id() is not null
            and u.org_id is not null
            and u.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is not null
            and u.org_id is null
          )
          or (
            public.current_org_id() is null
            and u.org_id is null
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- community_follows: org member ↔ same org OR global followee
-- ---------------------------------------------------------------------------
drop policy if exists "community_follows_select_org" on public.community_follows;
drop policy if exists "community_follows_insert_self_same_org" on public.community_follows;

create policy "community_follows_select_org"
  on public.community_follows
  for select
  to authenticated
  using (
    (
      public.current_org_id() is not null
      and exists (
        select 1 from public.users u
        where u.id = follower_id and u.org_id = public.current_org_id()
      )
      and exists (
        select 1 from public.users u
        where u.id = followee_id
          and (u.org_id = public.current_org_id() or u.org_id is null)
      )
    )
    or (
      public.current_org_id() is null
      and exists (select 1 from public.users u where u.id = follower_id and u.org_id is null)
      and exists (select 1 from public.users u where u.id = followee_id and u.org_id is null)
    )
  );

create policy "community_follows_insert_self_same_org"
  on public.community_follows
  for insert
  to authenticated
  with check (
    follower_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
        and exists (
          select 1 from public.users u
          where u.id = followee_id
            and (u.org_id = public.current_org_id() or u.org_id is null)
        )
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = followee_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id is null)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- community_network_requests / edges: org ↔ global (one-sided: org initiator)
-- ---------------------------------------------------------------------------
drop policy if exists "community_network_requests_select" on public.community_network_requests;
drop policy if exists "community_network_requests_insert" on public.community_network_requests;

create policy "community_network_requests_select"
  on public.community_network_requests
  for select
  to authenticated
  using (
    (requester_id = auth.uid() or addressee_id = auth.uid())
    and (
      (
        public.current_org_id() is not null
        and exists (
          select 1 from public.users u
          where u.id = requester_id and u.org_id = public.current_org_id()
        )
        and exists (
          select 1 from public.users u
          where u.id = addressee_id
            and (u.org_id = public.current_org_id() or u.org_id is null)
        )
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
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
        and exists (
          select 1 from public.users u
          where u.id = addressee_id
            and (u.org_id = public.current_org_id() or u.org_id is null)
        )
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = addressee_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id is null)
      )
    )
  );

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
        and exists (
          select 1 from public.users u
          where u.id = user_a
            and (u.org_id = public.current_org_id() or u.org_id is null)
        )
        and exists (
          select 1 from public.users u
          where u.id = user_b
            and (u.org_id = public.current_org_id() or u.org_id is null)
        )
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = user_a and u.org_id is null)
        and exists (select 1 from public.users u where u.id = user_b and u.org_id is null)
      )
    )
  );
