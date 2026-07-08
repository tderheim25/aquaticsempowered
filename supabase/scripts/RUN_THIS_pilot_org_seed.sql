-- Pilot program: seed / audit templates for Supabase MCP execute_sql
-- Replace :org_name and run sections as needed.

-- Example: mark an existing billing-root org as enterprise pilot through Sept 2026
-- update public.organizations
-- set
--   plan_code = 'enterprise',
--   founder = true,
--   pilot_access_until = '2026-09-30T23:59:59+00'::timestamptz
-- where name = 'Your Facility Name'
--   and billing_org_id = id;

-- Example: upsert active subscription for billing root (org_id = billing root id)
-- insert into public.subscriptions (
--   org_id, plan_code, status, current_period_end, pool_license_quantity
-- )
-- select
--   id,
--   'enterprise',
--   'active',
--   '2026-09-30T23:59:59+00'::timestamptz,
--   5
-- from public.organizations
-- where name = 'Your Facility Name' and billing_org_id = id
-- on conflict (org_id) do update set
--   plan_code = excluded.plan_code,
--   status = excluded.status,
--   current_period_end = excluded.current_period_end,
--   pool_license_quantity = excluded.pool_license_quantity;

-- ---------------------------------------------------------------------------
-- Post-import audit queries
-- ---------------------------------------------------------------------------

-- Pilot orgs expiring September 2026
select id, name, plan_code, pilot_access_until, founder
from public.organizations
where pilot_access_until is not null
order by name;

-- Users per pilot org
select o.name, u.email, u.role, om.is_owner
from public.organizations o
join public.organization_memberships om on om.org_id = o.id
join public.users u on u.id = om.user_id
where o.pilot_access_until is not null
order by o.name, om.is_owner desc;

-- Subscription health for pilot orgs (billing roots)
select o.name, s.status, s.plan_code, s.current_period_end, s.pool_license_quantity
from public.subscriptions s
join public.organizations o on o.id = s.org_id
where o.pilot_access_until is not null
  and o.billing_org_id = o.id
order by o.name;
