-- Step 2 of 2: support portal schema (run after 0027_support_technician_enum.sql is committed).
-- Requires public.user_role to already include 'support_technician'.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_support_technician()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'support_technician';
$$;

-- ---------------------------------------------------------------------------
-- Support providers (super-admin managed)
-- ---------------------------------------------------------------------------
create table if not exists public.support_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  contact_name text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state_code char(2) not null,
  postal_code text not null,
  country text not null default 'US',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists support_providers_state_code_idx on public.support_providers (state_code);
create index if not exists support_providers_is_active_idx on public.support_providers (is_active);

alter table public.support_providers enable row level security;

drop policy if exists "support_providers_select_authenticated" on public.support_providers;
create policy "support_providers_select_authenticated"
  on public.support_providers
  for select
  to authenticated
  using (true);

drop policy if exists "support_providers_write_super" on public.support_providers;
create policy "support_providers_write_super"
  on public.support_providers
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Users: link technicians to providers
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists support_provider_id uuid references public.support_providers (id) on delete set null;

create index if not exists users_support_provider_id_idx on public.users (support_provider_id);

-- After users.support_provider_id exists (function body is validated at create time)
-- row_security = off avoids infinite RLS recursion via current_org_id() on users
create or replace function public.current_support_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select u.support_provider_id
  from public.users u
  where u.id = auth.uid();
$$;

grant execute on function public.current_support_provider_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Support tickets: portal source, requester address, assignment
-- ---------------------------------------------------------------------------
alter table public.support_tickets
  add column if not exists requester_company_name text,
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state_code char(2),
  add column if not exists postal_code text,
  add column if not exists country text default 'US',
  add column if not exists assigned_support_provider_id uuid references public.support_providers (id) on delete set null,
  add column if not exists accepted_at timestamptz;

create index if not exists support_tickets_state_code_idx on public.support_tickets (state_code);
create index if not exists support_tickets_assigned_provider_idx on public.support_tickets (assigned_support_provider_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);

alter table public.support_tickets
  drop constraint if exists support_tickets_source_check;

alter table public.support_tickets
  add constraint support_tickets_source_check
  check (source in ('facility', 'community', 'portal'));

-- ---------------------------------------------------------------------------
-- RLS: support tickets (replace 0019 policies)
-- ---------------------------------------------------------------------------
drop policy if exists "tickets_select_scope" on public.support_tickets;
drop policy if exists "tickets_insert_scope" on public.support_tickets;
drop policy if exists "tickets_update_scope" on public.support_tickets;

create policy "tickets_select_scope"
  on public.support_tickets
  for select
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or created_by = auth.uid()
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
    or (
      public.is_support_technician()
      and (
        assigned_support_provider_id = public.current_support_provider_id()
        or (
          status = 'open'
          and assigned_support_provider_id is null
        )
      )
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
      )
      or (
        source = 'portal'
        and org_id is null
        and requester_company_name is not null
        and contact_name is not null
        and phone is not null
        and address_line1 is not null
        and city is not null
        and state_code is not null
        and postal_code is not null
      )
      or (
        source = 'portal'
        and org_id is not null
        and org_id = public.current_org_id()
        and requester_company_name is not null
        and contact_name is not null
        and phone is not null
        and address_line1 is not null
        and city is not null
        and state_code is not null
        and postal_code is not null
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
      created_by = auth.uid()
      and source in ('community', 'portal')
      and status = 'open'
      and assigned_support_provider_id is null
    )
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
    or (
      public.is_support_technician()
      and assigned_support_provider_id = public.current_support_provider_id()
    )
  );

-- ---------------------------------------------------------------------------
-- App roles + view permissions for support_technician
-- ---------------------------------------------------------------------------
insert into public.app_roles (slug, label, permissions_base, is_builtin, sort_order)
values ('support_technician', 'Support Technician', 'support_technician', true, 5)
on conflict (slug) do nothing;

insert into public.role_view_permissions (role, view_key, can_view)
values ('support_technician'::public.user_role, 'support_portal', true)
on conflict (role, view_key) do nothing;

insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, 'support_portal', true
from public.app_roles ar
where ar.slug = 'support_technician'
on conflict (role_id, view_key) do nothing;
