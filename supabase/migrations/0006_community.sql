-- Community: org-scoped social feed (posts, images, likes, follows, profiles)
-- Run after 0003_rls.sql (uses current_org_id, current_role)

-- ---------------------------------------------------------------------------
-- Profiles (bio shown on user profile)
-- ---------------------------------------------------------------------------
create table if not exists public.community_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  bio text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Posts & media
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_org_created_idx
  on public.community_posts (org_id, created_at desc);

create table if not exists public.community_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists community_post_media_post_idx
  on public.community_post_media (post_id, sort_order);

-- ---------------------------------------------------------------------------
-- Likes
-- ---------------------------------------------------------------------------
create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Network (one-way follow; same org only)
-- ---------------------------------------------------------------------------
create table if not exists public.community_follows (
  follower_id uuid not null references public.users (id) on delete cascade,
  followee_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint community_follows_no_self check (follower_id <> followee_id)
);

create index if not exists community_follows_followee_idx
  on public.community_follows (followee_id);

create index if not exists community_follows_follower_idx
  on public.community_follows (follower_id);

-- ---------------------------------------------------------------------------
-- RLS: community_profiles
-- ---------------------------------------------------------------------------
alter table public.community_profiles enable row level security;

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
          or (u.org_id is not null and u.org_id = public.current_org_id())
        )
    )
  );

create policy "community_profiles_insert_self"
  on public.community_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "community_profiles_update_self"
  on public.community_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: community_posts
-- ---------------------------------------------------------------------------
alter table public.community_posts enable row level security;

create policy "community_posts_select_org"
  on public.community_posts
  for select
  to authenticated
  using (org_id = public.current_org_id());

create policy "community_posts_insert_self"
  on public.community_posts
  for insert
  to authenticated
  with check (
    org_id = public.current_org_id()
    and author_id = auth.uid()
  );

create policy "community_posts_update_author"
  on public.community_posts
  for update
  to authenticated
  using (author_id = auth.uid() and org_id = public.current_org_id())
  with check (author_id = auth.uid() and org_id = public.current_org_id());

create policy "community_posts_delete_author"
  on public.community_posts
  for delete
  to authenticated
  using (author_id = auth.uid() and org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- RLS: community_post_media
-- ---------------------------------------------------------------------------
alter table public.community_post_media enable row level security;

create policy "community_post_media_select_org"
  on public.community_post_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_post_media.post_id
        and p.org_id = public.current_org_id()
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
        and p.org_id = public.current_org_id()
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
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: community_likes
-- ---------------------------------------------------------------------------
alter table public.community_likes enable row level security;

create policy "community_likes_select_org"
  on public.community_likes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_likes.post_id
        and p.org_id = public.current_org_id()
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
        and p.org_id = public.current_org_id()
    )
  );

create policy "community_likes_delete_self"
  on public.community_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: community_follows
-- ---------------------------------------------------------------------------
alter table public.community_follows enable row level security;

create policy "community_follows_select_org"
  on public.community_follows
  for select
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = follower_id and u.org_id = public.current_org_id())
    and exists (select 1 from public.users u where u.id = followee_id and u.org_id = public.current_org_id())
  );

create policy "community_follows_insert_self_same_org"
  on public.community_follows
  for insert
  to authenticated
  with check (
    follower_id = auth.uid()
    and exists (select 1 from public.users u where u.id = followee_id and u.org_id = public.current_org_id())
    and exists (select 1 from public.users u where u.id = auth.uid() and u.org_id = public.current_org_id())
  );

create policy "community_follows_delete_self"
  on public.community_follows
  for delete
  to authenticated
  using (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: community images (public read; org/user path for writes)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', false)
on conflict (id) do update set public = excluded.public;

create policy "community_media_select_org"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and split_part(name, '/', 1) = public.current_org_id()::text
  );

create policy "community_media_insert_own_prefix"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and split_part(name, '/', 1) = public.current_org_id()::text
    and split_part(name, '/', 2) = auth.uid()::text
  );

create policy "community_media_update_own_prefix"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-media'
    and split_part(name, '/', 1) = public.current_org_id()::text
    and split_part(name, '/', 2) = auth.uid()::text
  );

create policy "community_media_delete_own_prefix"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and split_part(name, '/', 1) = public.current_org_id()::text
    and split_part(name, '/', 2) = auth.uid()::text
  );
