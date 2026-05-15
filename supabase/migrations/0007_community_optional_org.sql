-- Community: allow posts (and media) with org_id NULL for users without a facility org.
-- Storage prefix for those users: global/{userId}/... (first path segment is literal "global").
-- Run after 0006_community.sql.

alter table public.community_posts
  alter column org_id drop not null;

create index if not exists community_posts_null_org_created_idx
  on public.community_posts (created_at desc)
  where org_id is null;

-- ---------------------------------------------------------------------------
-- users: no-org members can read other unassigned users (for author names in global feed)
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
      public.current_org_id() is null
      and org_id is null
    )
  );

-- ---------------------------------------------------------------------------
-- community_profiles
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
            public.current_org_id() is null
            and u.org_id is null
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- community_posts
-- ---------------------------------------------------------------------------
drop policy if exists "community_posts_select_org" on public.community_posts;
drop policy if exists "community_posts_insert_self" on public.community_posts;
drop policy if exists "community_posts_update_author" on public.community_posts;
drop policy if exists "community_posts_delete_author" on public.community_posts;

create policy "community_posts_select_org"
  on public.community_posts
  for select
  to authenticated
  using (
    (
      public.current_org_id() is not null
      and org_id is not null
      and org_id = public.current_org_id()
    )
    or (
      public.current_org_id() is null
      and org_id is null
    )
  );

create policy "community_posts_insert_self"
  on public.community_posts
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and org_id = public.current_org_id()
      )
      or (
        public.current_org_id() is null
        and org_id is null
      )
    )
  );

create policy "community_posts_update_author"
  on public.community_posts
  for update
  to authenticated
  using (
    author_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and org_id = public.current_org_id()
      )
      or (
        public.current_org_id() is null
        and org_id is null
      )
    )
  )
  with check (
    author_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and org_id = public.current_org_id()
      )
      or (
        public.current_org_id() is null
        and org_id is null
      )
    )
  );

create policy "community_posts_delete_author"
  on public.community_posts
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    and (
      (
        public.current_org_id() is not null
        and org_id = public.current_org_id()
      )
      or (
        public.current_org_id() is null
        and org_id is null
      )
    )
  );

-- ---------------------------------------------------------------------------
-- community_post_media
-- ---------------------------------------------------------------------------
drop policy if exists "community_post_media_select_org" on public.community_post_media;
drop policy if exists "community_post_media_insert_author" on public.community_post_media;
drop policy if exists "community_post_media_delete_author" on public.community_post_media;

create policy "community_post_media_select_org"
  on public.community_post_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_post_media.post_id
        and (
          (
            public.current_org_id() is not null
            and p.org_id is not null
            and p.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is null
            and p.org_id is null
          )
        )
    )
  );

create policy "community_post_media_insert_author"
  on public.community_post_media
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_post_media.post_id
        and p.author_id = auth.uid()
        and (
          (
            public.current_org_id() is not null
            and p.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is null
            and p.org_id is null
          )
        )
    )
  );

create policy "community_post_media_delete_author"
  on public.community_post_media
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_post_media.post_id
        and p.author_id = auth.uid()
        and (
          (
            public.current_org_id() is not null
            and p.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is null
            and p.org_id is null
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- community_likes
-- ---------------------------------------------------------------------------
drop policy if exists "community_likes_select_org" on public.community_likes;
drop policy if exists "community_likes_insert_self" on public.community_likes;
drop policy if exists "community_likes_delete_self" on public.community_likes;

create policy "community_likes_select_org"
  on public.community_likes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_likes.post_id
        and (
          (
            public.current_org_id() is not null
            and p.org_id is not null
            and p.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is null
            and p.org_id is null
          )
        )
    )
  );

create policy "community_likes_insert_self"
  on public.community_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.community_posts p
      where p.id = community_likes.post_id
        and (
          (
            public.current_org_id() is not null
            and p.org_id = public.current_org_id()
          )
          or (
            public.current_org_id() is null
            and p.org_id is null
          )
        )
    )
  );

create policy "community_likes_delete_self"
  on public.community_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- community_follows
-- ---------------------------------------------------------------------------
drop policy if exists "community_follows_select_org" on public.community_follows;
drop policy if exists "community_follows_insert_self_same_org" on public.community_follows;
drop policy if exists "community_follows_delete_self" on public.community_follows;

create policy "community_follows_select_org"
  on public.community_follows
  for select
  to authenticated
  using (
    (
      public.current_org_id() is not null
      and exists (select 1 from public.users u where u.id = follower_id and u.org_id = public.current_org_id())
      and exists (select 1 from public.users u where u.id = followee_id and u.org_id = public.current_org_id())
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
        and exists (select 1 from public.users u where u.id = followee_id and u.org_id = public.current_org_id())
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
      )
      or (
        public.current_org_id() is null
        and exists (select 1 from public.users u where u.id = followee_id and u.org_id is null)
        and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id is null)
      )
    )
  );

create policy "community_follows_delete_self"
  on public.community_follows
  for delete
  to authenticated
  using (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: community-media (org prefix OR global prefix for unassigned users)
-- ---------------------------------------------------------------------------
drop policy if exists "community_media_select_org" on storage.objects;
drop policy if exists "community_media_insert_own_prefix" on storage.objects;
drop policy if exists "community_media_update_own_prefix" on storage.objects;
drop policy if exists "community_media_delete_own_prefix" on storage.objects;

create policy "community_media_select_org"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (
      (
        public.current_org_id() is not null
        and split_part(name, '/', 1) = public.current_org_id()::text
      )
      or (
        public.current_org_id() is null
        and split_part(name, '/', 1) = 'global'
      )
    )
  );

create policy "community_media_insert_own_prefix"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and (
      (
        public.current_org_id() is not null
        and split_part(name, '/', 1) = public.current_org_id()::text
        and split_part(name, '/', 2) = auth.uid()::text
      )
      or (
        public.current_org_id() is null
        and split_part(name, '/', 1) = 'global'
        and split_part(name, '/', 2) = auth.uid()::text
      )
    )
  );

create policy "community_media_update_own_prefix"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-media'
    and (
      (
        public.current_org_id() is not null
        and split_part(name, '/', 1) = public.current_org_id()::text
        and split_part(name, '/', 2) = auth.uid()::text
      )
      or (
        public.current_org_id() is null
        and split_part(name, '/', 1) = 'global'
        and split_part(name, '/', 2) = auth.uid()::text
      )
    )
  );

create policy "community_media_delete_own_prefix"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (
      (
        public.current_org_id() is not null
        and split_part(name, '/', 1) = public.current_org_id()::text
        and split_part(name, '/', 2) = auth.uid()::text
      )
      or (
        public.current_org_id() is null
        and split_part(name, '/', 1) = 'global'
        and split_part(name, '/', 2) = auth.uid()::text
      )
    )
  );
