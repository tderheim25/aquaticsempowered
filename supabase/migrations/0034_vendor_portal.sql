-- Vendor portal: link users to vendors, marketplace product inquiries, vendor-scoped access

-- ---------------------------------------------------------------------------
-- users.vendor_id
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists vendor_id uuid references public.vendors (id) on delete set null;

create index if not exists users_vendor_id_idx on public.users (vendor_id) where vendor_id is not null;

-- ---------------------------------------------------------------------------
-- Marketplace product inquiries
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_product_inquiries (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  product_id uuid not null references public.vendor_products (id) on delete cascade,
  from_user_id uuid references public.users (id) on delete set null,
  from_name text not null,
  from_email text not null,
  from_org_name text,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_product_inquiries_vendor_idx
  on public.vendor_product_inquiries (vendor_id, created_at desc);

create index if not exists vendor_product_inquiries_product_idx
  on public.vendor_product_inquiries (product_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select vendor_id from public.users where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- RLS: vendor_product_inquiries
-- ---------------------------------------------------------------------------
alter table public.vendor_product_inquiries enable row level security;

drop policy if exists "vendor_inquiries_insert_authenticated" on public.vendor_product_inquiries;
create policy "vendor_inquiries_insert_authenticated"
  on public.vendor_product_inquiries
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.vendor_products p
      where p.id = product_id
        and p.vendor_id = vendor_product_inquiries.vendor_id
        and p.is_visible = true
    )
  );

drop policy if exists "vendor_inquiries_insert_public" on public.vendor_product_inquiries;
create policy "vendor_inquiries_insert_public"
  on public.vendor_product_inquiries
  for insert
  to anon
  with check (
    from_user_id is null
    and exists (
      select 1
      from public.vendor_products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id
        and p.vendor_id = vendor_product_inquiries.vendor_id
        and p.is_visible = true
        and v.listing_visible = true
    )
  );

drop policy if exists "vendor_inquiries_select_own" on public.vendor_product_inquiries;
create policy "vendor_inquiries_select_own"
  on public.vendor_product_inquiries
  for select
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or vendor_id = public.current_vendor_id()
  );

drop policy if exists "vendor_inquiries_update_own" on public.vendor_product_inquiries;
create policy "vendor_inquiries_update_own"
  on public.vendor_product_inquiries
  for update
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or vendor_id = public.current_vendor_id()
  )
  with check (
    public.current_role() = 'super_admin'
    or vendor_id = public.current_vendor_id()
  );

-- ---------------------------------------------------------------------------
-- RLS: vendors / products — vendor members can read & update own listing
-- ---------------------------------------------------------------------------
drop policy if exists "vendors_select_own" on public.vendors;
create policy "vendors_select_own"
  on public.vendors
  for select
  to authenticated
  using (
    listing_visible = true
    or public.current_role() = 'super_admin'
    or id = public.current_vendor_id()
  );

drop policy if exists "vendors_update_own" on public.vendors;
create policy "vendors_update_own"
  on public.vendors
  for update
  to authenticated
  using (id = public.current_vendor_id() or public.current_role() = 'super_admin')
  with check (id = public.current_vendor_id() or public.current_role() = 'super_admin');

drop policy if exists "vendor_products_select_own" on public.vendor_products;
create policy "vendor_products_select_own"
  on public.vendor_products
  for select
  to authenticated
  using (
    is_visible = true
    or public.current_role() = 'super_admin'
    or vendor_id = public.current_vendor_id()
  );

drop policy if exists "vendor_products_write_own" on public.vendor_products;
create policy "vendor_products_write_own"
  on public.vendor_products
  for all
  to authenticated
  using (vendor_id = public.current_vendor_id() or public.current_role() = 'super_admin')
  with check (vendor_id = public.current_vendor_id() or public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Realtime (vendor inbox)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vendor_product_inquiries'
  ) then
    execute 'alter publication supabase_realtime add table public.vendor_product_inquiries';
  end if;
end $$;

-- Applicants can see their own vendor application status
drop policy if exists "vendor_applications_select_own_email" on public.vendor_applications;
create policy "vendor_applications_select_own_email"
  on public.vendor_applications
  for select
  to authenticated
  using (
    lower(email) = lower((select email from public.users where id = auth.uid()))
  );
