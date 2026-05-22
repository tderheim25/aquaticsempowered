-- Founder onboarding: wizard flow (organization details, founder account or demo request)
-- Run after 0022_vendor_application_website.sql

-- ---------------------------------------------------------------------------
-- organizations: optional contact / website fields collected during onboarding
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists website_url text,
  add column if not exists phone text;

-- ---------------------------------------------------------------------------
-- leads: extend with new onboarding context (website, address, request type,
-- linked org/user, requested plan). Existing rows default to founder_form.
-- ---------------------------------------------------------------------------
alter table public.leads
  add column if not exists website_url text,
  add column if not exists address jsonb not null default '{}'::jsonb,
  add column if not exists request_type text not null default 'founder_account'
    check (request_type in ('founder_account', 'demo')),
  add column if not exists requested_plan_code public.plan_code,
  add column if not exists org_id uuid references public.organizations (id) on delete set null,
  add column if not exists user_id uuid references public.users (id) on delete set null,
  add column if not exists notified_at timestamptz;

create index if not exists leads_request_type_idx
  on public.leads (request_type, created_at desc);

create index if not exists leads_org_idx
  on public.leads (org_id);

-- Anonymous and authenticated visitors can already insert (see 0003_rls.sql);
-- add a super-admin update policy so demo notifications can stamp notified_at.
drop policy if exists "leads_update_super" on public.leads;
create policy "leads_update_super"
  on public.leads
  for update
  to authenticated
  using (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- platform_settings: simple key/value config managed by super admins
-- (used initially for the demo-request notification email).
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id)
);

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_select_super" on public.platform_settings;
create policy "platform_settings_select_super"
  on public.platform_settings
  for select
  to authenticated
  using (public.current_role() = 'super_admin');

drop policy if exists "platform_settings_write_super" on public.platform_settings;
create policy "platform_settings_write_super"
  on public.platform_settings
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

insert into public.platform_settings (key, value, description)
values
  (
    'demo_request_email',
    '{"email": ""}'::jsonb,
    'Inbox that receives founder demo-request notifications.'
  )
on conflict (key) do nothing;
