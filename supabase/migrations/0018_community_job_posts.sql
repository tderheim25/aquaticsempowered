-- Community job postings (org-scoped or global partition, same as community_posts)
-- Run after 0007_community_optional_org.sql

create table if not exists public.community_job_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  company_name text not null default '',
  location text not null default '',
  employment_type text not null default 'full_time',
  description text not null default '',
  apply_url text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_job_posts_title_len check (char_length(trim(title)) between 1 and 200),
  constraint community_job_posts_description_len check (char_length(trim(description)) >= 10),
  constraint community_job_posts_employment_type check (
    employment_type in ('full_time', 'part_time', 'seasonal', 'contract', 'internship')
  )
);

create index if not exists community_job_posts_org_created_idx
  on public.community_job_posts (org_id, created_at desc);

create index if not exists community_job_posts_null_org_created_idx
  on public.community_job_posts (created_at desc)
  where org_id is null;

alter table public.community_job_posts enable row level security;

create policy "community_job_posts_select_org"
  on public.community_job_posts
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

create policy "community_job_posts_insert_self"
  on public.community_job_posts
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

create policy "community_job_posts_update_author"
  on public.community_job_posts
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

create policy "community_job_posts_delete_author"
  on public.community_job_posts
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
