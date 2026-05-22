-- Org invitations: replace Supabase magic-link invites with first-class invitation records.
-- - New users follow an email link to /signup?invite=<token> and create their account.
-- - Existing users see the invite in their notification bell and accept/decline in-app.

create table if not exists public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'staff',
  app_role_id uuid references public.app_roles (id) on delete set null,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  invited_by uuid references public.users (id) on delete set null,
  invited_user_id uuid references public.users (id) on delete set null,
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days')
);

create unique index if not exists org_invitations_pending_unique
  on public.org_invitations (org_id, lower(email))
  where status = 'pending';

create index if not exists org_invitations_email_idx
  on public.org_invitations (lower(email), status);

create index if not exists org_invitations_org_idx
  on public.org_invitations (org_id, status, created_at desc);

create index if not exists org_invitations_invited_user_idx
  on public.org_invitations (invited_user_id, status);

alter table public.org_invitations enable row level security;

-- Org admins manage their own org's invitations
drop policy if exists "org_invitations_select_org_admin" on public.org_invitations;
create policy "org_invitations_select_org_admin"
  on public.org_invitations
  for select
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or (
      public.current_role() = 'org_admin'
      and org_id = public.current_org_id()
    )
  );

drop policy if exists "org_invitations_insert_org_admin" on public.org_invitations;
create policy "org_invitations_insert_org_admin"
  on public.org_invitations
  for insert
  to authenticated
  with check (
    public.current_role() = 'super_admin'
    or (
      public.current_role() = 'org_admin'
      and org_id = public.current_org_id()
    )
  );

drop policy if exists "org_invitations_update_org_admin" on public.org_invitations;
create policy "org_invitations_update_org_admin"
  on public.org_invitations
  for update
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or (
      public.current_role() = 'org_admin'
      and org_id = public.current_org_id()
    )
  );

-- Invitees can view their own pending invitations (matched by lowercase email)
drop policy if exists "org_invitations_select_self" on public.org_invitations;
create policy "org_invitations_select_self"
  on public.org_invitations
  for select
  to authenticated
  using (
    status = 'pending'
    and lower(email) = lower((auth.jwt() ->> 'email')::text)
  );

drop policy if exists "org_invitations_update_self" on public.org_invitations;
create policy "org_invitations_update_self"
  on public.org_invitations
  for update
  to authenticated
  using (
    status = 'pending'
    and lower(email) = lower((auth.jwt() ->> 'email')::text)
  )
  with check (
    lower(email) = lower((auth.jwt() ->> 'email')::text)
    and status in ('accepted', 'declined')
  );
