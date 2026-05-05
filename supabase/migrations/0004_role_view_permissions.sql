-- Role-based dashboard view permissions
-- Run after 0003_rls.sql

create table if not exists public.role_view_permissions (
  role public.user_role not null,
  view_key text not null,
  can_view boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (role, view_key)
);

create or replace function public.set_role_view_permissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_role_view_permissions_updated_at on public.role_view_permissions;
create trigger set_role_view_permissions_updated_at
  before update on public.role_view_permissions
  for each row
  execute procedure public.set_role_view_permissions_updated_at();

alter table public.role_view_permissions enable row level security;

drop policy if exists "role_view_permissions_select_all_authenticated" on public.role_view_permissions;
create policy "role_view_permissions_select_all_authenticated" on public.role_view_permissions
  for select
  to authenticated
  using (true);

drop policy if exists "role_view_permissions_write_super" on public.role_view_permissions;
create policy "role_view_permissions_write_super" on public.role_view_permissions
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

insert into public.role_view_permissions (role, view_key, can_view)
values
  ('super_admin', 'dashboard_home', true),
  ('super_admin', 'chemical_logs', true),
  ('super_admin', 'maintenance', true),
  ('super_admin', 'support_center', true),
  ('super_admin', 'vendor_directory', true),
  ('super_admin', 'community', true),
  ('super_admin', 'procurement', true),
  ('super_admin', 'training_cpo', true),
  ('super_admin', 'monitoring', true),
  ('super_admin', 'admin_portal', true),

  ('org_admin', 'dashboard_home', true),
  ('org_admin', 'chemical_logs', true),
  ('org_admin', 'maintenance', true),
  ('org_admin', 'support_center', true),
  ('org_admin', 'vendor_directory', true),
  ('org_admin', 'community', true),
  ('org_admin', 'procurement', true),
  ('org_admin', 'training_cpo', true),
  ('org_admin', 'monitoring', true),
  ('org_admin', 'admin_portal', false),

  ('manager', 'dashboard_home', true),
  ('manager', 'chemical_logs', true),
  ('manager', 'maintenance', true),
  ('manager', 'support_center', true),
  ('manager', 'vendor_directory', true),
  ('manager', 'community', true),
  ('manager', 'procurement', false),
  ('manager', 'training_cpo', false),
  ('manager', 'monitoring', false),
  ('manager', 'admin_portal', false),

  ('staff', 'dashboard_home', true),
  ('staff', 'chemical_logs', true),
  ('staff', 'maintenance', true),
  ('staff', 'support_center', true),
  ('staff', 'vendor_directory', false),
  ('staff', 'community', false),
  ('staff', 'procurement', false),
  ('staff', 'training_cpo', false),
  ('staff', 'monitoring', false),
  ('staff', 'admin_portal', false),

  ('vendor', 'dashboard_home', true),
  ('vendor', 'chemical_logs', false),
  ('vendor', 'maintenance', false),
  ('vendor', 'support_center', true),
  ('vendor', 'vendor_directory', true),
  ('vendor', 'community', false),
  ('vendor', 'procurement', false),
  ('vendor', 'training_cpo', false),
  ('vendor', 'monitoring', false),
  ('vendor', 'admin_portal', false)
on conflict (role, view_key) do nothing;

