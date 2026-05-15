-- Comments on community posts (same visibility partition as community_posts).

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_post_comments_body_nonempty check (char_length(trim(body)) > 0)
);

create index if not exists community_post_comments_post_created_idx
  on public.community_post_comments (post_id, created_at asc);

alter table public.community_post_comments enable row level security;

create policy "community_post_comments_select_visible"
  on public.community_post_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_posts p
      where p.id = community_post_comments.post_id
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

create policy "community_post_comments_insert_member"
  on public.community_post_comments
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and char_length(trim(body)) > 0
    and exists (
      select 1
      from public.community_posts p
      where p.id = community_post_comments.post_id
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

create policy "community_post_comments_delete_own"
  on public.community_post_comments
  for delete
  to authenticated
  using (author_id = auth.uid());
