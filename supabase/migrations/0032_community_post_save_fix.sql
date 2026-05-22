-- Fix community post saves (combines essentials from 0007 + 0008).
-- Safe to run even if 0007/0008 were already applied — uses IF NOT EXISTS / DROP IF EXISTS.
-- After running: sign out and sign back in so your JWT matches public.users.

-- ---------------------------------------------------------------------------
-- 1) Allow global community posts (org_id nullable)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_posts'
      and column_name = 'org_id'
      and is_nullable = 'NO'
  ) then
    alter table public.community_posts alter column org_id drop not null;
  end if;
end $$;

create index if not exists community_posts_null_org_created_idx
  on public.community_posts (created_at desc)
  where org_id is null;

-- ---------------------------------------------------------------------------
-- 2) JWT org_id / user_role hook (0008) + current_org_id fallback (0025)
-- ---------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  uid uuid;
  u_org uuid;
  u_role public.user_role;
begin
  uid := (event->>'user_id')::uuid;
  if uid is null then
    return event;
  end if;

  select org_id, role into u_org, u_role
  from public.users
  where id = uid;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if u_org is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(u_org::text), true);
  else
    claims := claims - 'org_id';
  end if;

  if u_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(u_role::text), true);
  else
    claims := claims - 'user_role';
  end if;

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    nullif(
      trim(both '"' from (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')),
      ''
    )::uuid,
    (select u.org_id from public.users u where u.id = auth.uid())
  );
$$;

grant execute on function public.current_org_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) community_posts RLS (org partition + global partition)
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
-- 4) Storage bucket + policies (global/{userId}/... or {orgId}/{userId}/...)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('community-media', 'community-media', false)
on conflict (id) do nothing;

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
