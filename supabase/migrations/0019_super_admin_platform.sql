-- Super-admin platform: support extensions, vendors, training, ads, moderation, org_admin user updates
-- Run after 0018_community_job_posts.sql

-- ---------------------------------------------------------------------------
-- Support tickets: facility + community (nullable org)
-- ---------------------------------------------------------------------------
alter table public.support_tickets
  alter column org_id drop not null;

alter table public.support_tickets
  add column if not exists source text not null default 'facility';

alter table public.support_tickets
  drop constraint if exists support_tickets_source_check;

alter table public.support_tickets
  add constraint support_tickets_source_check
  check (source in ('facility', 'community'));

drop policy if exists "tickets_select_org" on public.support_tickets;
drop policy if exists "tickets_write_org" on public.support_tickets;

create policy "tickets_select_scope"
  on public.support_tickets
  for select
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
    or (
      source = 'community'
      and org_id is null
      and created_by = auth.uid()
    )
  );

create policy "tickets_insert_scope"
  on public.support_tickets
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (
        source = 'facility'
        and org_id is not null
        and org_id = public.current_org_id()
      )
      or (
        source = 'community'
        and org_id is null
        and public.current_org_id() is null
      )
      or (
        source = 'community'
        and org_id is null
      )
    )
  );

create policy "tickets_update_scope"
  on public.support_tickets
  for update
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
    or (created_by = auth.uid() and source = 'community')
  );

-- ---------------------------------------------------------------------------
-- Org admin: update users in same org (not org_id, not super_admin)
-- ---------------------------------------------------------------------------
create policy "users_update_org_admin_same_org"
  on public.users
  for update
  to authenticated
  using (
    public.current_role() = 'org_admin'
    and org_id is not null
    and org_id = public.current_org_id()
  )
  with check (
    org_id = public.current_org_id()
    and role <> 'super_admin'
    and role <> 'vendor'
  );

-- ---------------------------------------------------------------------------
-- Vendor applications + products
-- ---------------------------------------------------------------------------
alter table public.vendors
  add column if not exists slug text,
  add column if not exists logo_url text,
  add column if not exists tagline text,
  add column if not exists website_url text,
  add column if not exists is_partner boolean not null default false,
  add column if not exists description text not null default '';

create unique index if not exists vendors_slug_unique on public.vendors (slug) where slug is not null;

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null default '',
  email text not null,
  phone text,
  category text,
  message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id),
  vendor_id uuid references public.vendors (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  description text not null default '',
  image_url text,
  product_url text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vendor_products_vendor_idx on public.vendor_products (vendor_id, sort_order);

alter table public.vendor_applications enable row level security;
alter table public.vendor_products enable row level security;

create policy "vendor_applications_insert_public"
  on public.vendor_applications
  for insert
  to anon, authenticated
  with check (true);

create policy "vendor_applications_select_super"
  on public.vendor_applications
  for select
  to authenticated
  using (public.current_role() = 'super_admin');

create policy "vendor_applications_update_super"
  on public.vendor_applications
  for update
  to authenticated
  using (public.current_role() = 'super_admin');

create policy "vendor_products_select_visible"
  on public.vendor_products
  for select
  using (is_visible = true or public.current_role() = 'super_admin');

create policy "vendor_products_write_super"
  on public.vendor_products
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Job posts moderation (community_job_posts)
-- ---------------------------------------------------------------------------
alter table public.community_job_posts
  add column if not exists status text not null default 'active'
    check (status in ('active', 'blocked', 'closed')),
  add column if not exists is_promoted boolean not null default false;

create policy "community_job_posts_select_super"
  on public.community_job_posts
  for select
  to authenticated
  using (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Training courses + videos
-- ---------------------------------------------------------------------------
create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_course_videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses (id) on delete cascade,
  title text not null,
  video_url text,
  storage_path text,
  duration_seconds integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.training_courses enable row level security;
alter table public.training_course_videos enable row level security;

create policy "training_courses_select_published"
  on public.training_courses
  for select
  using (is_published = true or public.current_role() = 'super_admin');

create policy "training_courses_write_super"
  on public.training_courses
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

create policy "training_course_videos_select_published"
  on public.training_course_videos
  for select
  using (
    public.current_role() = 'super_admin'
    or exists (
      select 1 from public.training_courses c
      where c.id = course_id and c.is_published = true
    )
  );

create policy "training_course_videos_write_super"
  on public.training_course_videos
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Community moderation
-- ---------------------------------------------------------------------------
alter table public.community_posts
  add column if not exists moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'blocked')),
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references public.users (id),
  add column if not exists moderation_note text;

alter table public.community_post_comments
  add column if not exists moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'blocked')),
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references public.users (id),
  add column if not exists moderation_note text;

-- ---------------------------------------------------------------------------
-- Ad placements
-- ---------------------------------------------------------------------------
create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null,
  title text not null default '',
  image_url text,
  target_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ad_placements_slot_idx on public.ad_placements (slot_key, is_active, sort_order);

alter table public.ad_placements enable row level security;

create policy "ad_placements_select_active"
  on public.ad_placements
  for select
  using (
    is_active = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

create policy "ad_placements_write_super"
  on public.ad_placements
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- Super-admin policies for job posts update/delete
create policy "community_job_posts_update_super"
  on public.community_job_posts
  for update
  to authenticated
  using (public.current_role() = 'super_admin');

create policy "community_job_posts_delete_super"
  on public.community_job_posts
  for delete
  to authenticated
  using (public.current_role() = 'super_admin');
