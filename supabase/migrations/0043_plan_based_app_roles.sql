-- Plan-branded app roles, founder user tagging, migrate away from visible org_admin app role.
-- Run after 0042_subscriptions_pool_license_qty.sql

-- ---------------------------------------------------------------------------
-- Founder columns on users
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists is_founder boolean not null default false,
  add column if not exists founder_enrolled_at timestamptz;

create index if not exists users_is_founder_idx on public.users (is_founder) where is_founder = true;

-- ---------------------------------------------------------------------------
-- New built-in app roles
-- ---------------------------------------------------------------------------
insert into public.app_roles (slug, label, permissions_base, is_builtin, sort_order)
values
  ('default_user', 'Default User', 'staff', true, 1),
  ('essential_owner', 'Essential Owner', 'org_admin', true, 2),
  ('professional_owner', 'Professional Owner', 'org_admin', true, 3),
  ('enterprise_owner', 'Enterprise Owner', 'org_admin', true, 4)
on conflict (slug) do update set
  label = excluded.label,
  permissions_base = excluded.permissions_base,
  is_builtin = excluded.is_builtin,
  sort_order = excluded.sort_order;

update public.app_roles set sort_order = 5 where slug = 'manager';
update public.app_roles set sort_order = 6 where slug = 'staff';
update public.app_roles set sort_order = 7 where slug = 'vendor';
update public.app_roles set sort_order = 8 where slug = 'support_technician';

-- ---------------------------------------------------------------------------
-- View permissions per plan-branded role
-- ---------------------------------------------------------------------------
insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, v.view_key, v.can_view
from public.app_roles ar
cross join (
  values
    ('dashboard_home', true),
    ('community', true),
    ('vendor_directory', true)
) as v(view_key, can_view)
where ar.slug = 'default_user'
on conflict (role_id, view_key) do update set can_view = excluded.can_view;

insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, v.view_key, v.can_view
from public.app_roles ar
cross join (
  values
    ('dashboard_home', true),
    ('pools', true),
    ('chemical_logs', true),
    ('maintenance', true),
    ('support_center', true),
    ('vendor_directory', true),
    ('training_cpo', true),
    ('billing', true)
) as v(view_key, can_view)
where ar.slug = 'essential_owner'
on conflict (role_id, view_key) do update set can_view = excluded.can_view;

insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, v.view_key, v.can_view
from public.app_roles ar
cross join (
  values
    ('dashboard_home', true),
    ('pools', true),
    ('chemical_logs', true),
    ('maintenance', true),
    ('support_center', true),
    ('vendor_directory', true),
    ('training_cpo', true),
    ('billing', true),
    ('procurement', true),
    ('energy_audits', true)
) as v(view_key, can_view)
where ar.slug = 'professional_owner'
on conflict (role_id, view_key) do update set can_view = excluded.can_view;

insert into public.app_role_view_permissions (role_id, view_key, can_view)
select ar.id, v.view_key, v.can_view
from public.app_roles ar
cross join (
  values
    ('dashboard_home', true),
    ('pools', true),
    ('chemical_logs', true),
    ('maintenance', true),
    ('support_center', true),
    ('vendor_directory', true),
    ('community', true),
    ('procurement', true),
    ('training_cpo', true),
    ('monitoring', true),
    ('energy_audits', true),
    ('billing', true)
) as v(view_key, can_view)
where ar.slug = 'enterprise_owner'
on conflict (role_id, view_key) do update set can_view = excluded.can_view;

-- ---------------------------------------------------------------------------
-- Migrate org_admin app_role users → plan-based owner roles
-- ---------------------------------------------------------------------------
with legacy as (
  select id from public.app_roles where slug = 'org_admin'
),
owner_plan as (
  select
    u.id as user_id,
    case coalesce(billing.plan_code, 'essential')
      when 'enterprise' then 'enterprise_owner'
      when 'pro' then 'professional_owner'
      else 'essential_owner'
    end as target_slug
  from public.users u
  left join public.organizations o on o.id = u.org_id
  left join public.organizations billing on billing.id = coalesce(o.billing_org_id, o.id)
  where u.role = 'org_admin'
     or u.app_role_id in (select id from legacy)
),
role_ids as (
  select slug, id from public.app_roles
  where slug in ('essential_owner', 'professional_owner', 'enterprise_owner')
)
update public.users u
set app_role_id = ri.id
from owner_plan op
join role_ids ri on ri.slug = op.target_slug
where u.id = op.user_id;

-- Staff without org → Default User
update public.users u
set app_role_id = ar.id
from public.app_roles ar
where ar.slug = 'default_user'
  and u.role = 'staff'
  and u.org_id is null
  and u.support_provider_id is null
  and (u.app_role_id is null or u.app_role_id in (select id from public.app_roles where slug in ('staff', 'org_admin')));

-- Pending invites: org_admin → staff (owners are not invited)
update public.org_invitations oi
set
  role = 'staff',
  app_role_id = (select id from public.app_roles where slug = 'staff')
where oi.role = 'org_admin';

-- Backfill founder tags from founder org owners
update public.users u
set
  is_founder = true,
  founder_enrolled_at = coalesce(u.founder_enrolled_at, u.created_at)
where u.is_founder = false
  and exists (
    select 1
    from public.organization_memberships om
    join public.organizations o on o.id = om.org_id
    where om.user_id = u.id
      and om.is_owner = true
      and o.founder = true
  );

-- Also tag owners linked via org_id on a founder billing root
update public.users u
set
  is_founder = true,
  founder_enrolled_at = coalesce(u.founder_enrolled_at, u.created_at)
where u.is_founder = false
  and u.org_id is not null
  and exists (
    select 1
    from public.organizations o
    join public.organizations billing on billing.id = coalesce(o.billing_org_id, o.id)
    where o.id = u.org_id
      and billing.founder = true
      and u.role = 'org_admin'
  );

-- Paid plans (essential / pro / enterprise): treat billing-root owners as founder
update public.organizations
set founder = true
where plan_code in ('essential', 'pro', 'enterprise')
  and founder = false;

update public.users u
set
  is_founder = true,
  founder_enrolled_at = coalesce(u.founder_enrolled_at, u.created_at)
where u.is_founder = false
  and u.role = 'org_admin'
  and exists (
    select 1
    from public.organization_memberships om
    join public.organizations o on o.id = om.org_id
    join public.organizations billing on billing.id = coalesce(o.billing_org_id, o.id)
    where om.user_id = u.id
      and om.is_owner = true
      and billing.plan_code in ('essential', 'pro', 'enterprise')
  );

update public.users u
set
  is_founder = true,
  founder_enrolled_at = coalesce(u.founder_enrolled_at, u.created_at)
where u.is_founder = false
  and u.org_id is not null
  and u.role = 'org_admin'
  and exists (
    select 1
    from public.organizations o
    join public.organizations billing on billing.id = coalesce(o.billing_org_id, o.id)
    where o.id = u.org_id
      and billing.plan_code in ('essential', 'pro', 'enterprise')
  );

-- Deprecate built-in org_admin app role (JWT enum unchanged)
update public.app_roles
set
  slug = 'org_admin_legacy',
  label = 'Org Admin (legacy)',
  is_builtin = false,
  sort_order = 99
where slug = 'org_admin';
