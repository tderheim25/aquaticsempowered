-- Multi-facility organizations: billing root, memberships, active org preference

-- ---------------------------------------------------------------------------
-- organizations: billing root + creator
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists billing_org_id uuid references public.organizations (id) on delete restrict,
  add column if not exists created_by_user_id uuid references public.users (id) on delete set null;

update public.organizations
set billing_org_id = id
where billing_org_id is null;

alter table public.organizations
  alter column billing_org_id set not null;

create index if not exists organizations_billing_org_id_idx
  on public.organizations (billing_org_id);

-- ---------------------------------------------------------------------------
-- organization_memberships
-- ---------------------------------------------------------------------------
create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role public.user_role not null default 'staff',
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, org_id)
);

create index if not exists organization_memberships_user_id_idx
  on public.organization_memberships (user_id);

create index if not exists organization_memberships_org_id_idx
  on public.organization_memberships (org_id);

insert into public.organization_memberships (user_id, org_id, role, is_owner)
select u.id, u.org_id, u.role, (u.role = 'org_admin')
from public.users u
where u.org_id is not null
on conflict (user_id, org_id) do nothing;

-- ---------------------------------------------------------------------------
-- user_preferences: active facility for JWT / RLS
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  active_org_id uuid references public.organizations (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.user_preferences (user_id, active_org_id)
select u.id, u.org_id
from public.users u
where u.org_id is not null
on conflict (user_id) do update
  set active_org_id = excluded.active_org_id
  where public.user_preferences.active_org_id is null;
