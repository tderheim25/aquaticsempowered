-- Seed founder status for all paid-plan billing accounts (essential, pro, enterprise).
-- Run after 0043_plan_based_app_roles.sql if that migration was applied before this backfill existed.

-- Org-level founder flag (pricing + facility inheritance)
update public.organizations
set founder = true
where plan_code in ('essential', 'pro', 'enterprise')
  and founder = false;

-- User-level founder tag for billing-root owners
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
