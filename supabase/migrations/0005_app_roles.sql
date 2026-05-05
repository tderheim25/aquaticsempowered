-- Dynamic app roles + per-role view permissions (run after 0004_role_view_permissions.sql)
-- Extends RBAC: users keep enum `role` for JWT/RLS; optional `app_role_id` selects UI/views.

create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  permissions_base public.user_role not null default 'staff',
  is_builtin boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.app_roles (slug, label, permissions_base, is_builtin, sort_order)
values
  ('super_admin', 'Super Admin', 'super_admin', true, 0),
  ('org_admin', 'Org Admin', 'org_admin', true, 1),
  ('manager', 'Manager', 'manager', true, 2),
  ('staff', 'Staff', 'staff', true, 3),
  ('vendor', 'Vendor', 'vendor', true, 4)
on conflict (slug) do nothing;

alter table public.users
  add column if not exists app_role_id uuid references public.app_roles (id) on delete set null;

create table if not exists public.app_role_view_permissions (
  role_id uuid not null references public.app_roles (id) on delete cascade,
  view_key text not null,
  can_view boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (role_id, view_key)
);

create or replace function public.set_app_role_view_permissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_role_view_permissions_updated_at on public.app_role_view_permissions;
create trigger set_app_role_view_permissions_updated_at
  before update on public.app_role_view_permissions
  for each row
  execute procedure public.set_app_role_view_permissions_updated_at();

-- Migrate rows from legacy role_view_permissions (enum key) into app_role_view_permissions
insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, rvp.view_key, rvp.can_view
from public.role_view_permissions rvp
join public.app_roles ar on ar.slug = rvp.role::text
on conflict (role_id, view_key) do nothing;

alter table public.app_roles enable row level security;
alter table public.app_role_view_permissions enable row level security;

drop policy if exists "app_roles_select_authenticated" on public.app_roles;
create policy "app_roles_select_authenticated" on public.app_roles
  for select to authenticated using (true);

drop policy if exists "app_roles_write_super" on public.app_roles;
create policy "app_roles_write_super" on public.app_roles
  for all to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

drop policy if exists "app_role_view_permissions_select_authenticated" on public.app_role_view_permissions;
create policy "app_role_view_permissions_select_authenticated" on public.app_role_view_permissions
  for select to authenticated using (true);

drop policy if exists "app_role_view_permissions_write_super" on public.app_role_view_permissions;
create policy "app_role_view_permissions_write_super" on public.app_role_view_permissions
  for all to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');
