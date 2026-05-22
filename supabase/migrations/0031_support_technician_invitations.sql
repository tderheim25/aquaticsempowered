-- Support technician invitations (super admin → email → signup → support_technician + provider link).

create table if not exists public.support_technician_invitations (
  id uuid primary key default gen_random_uuid(),
  support_provider_id uuid not null references public.support_providers (id) on delete cascade,
  email text not null,
  full_name text,
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

create unique index if not exists support_technician_invitations_pending_unique
  on public.support_technician_invitations (support_provider_id, lower(email))
  where status = 'pending';

create index if not exists support_technician_invitations_email_idx
  on public.support_technician_invitations (lower(email), status);

create index if not exists support_technician_invitations_provider_idx
  on public.support_technician_invitations (support_provider_id, status, created_at desc);

alter table public.support_technician_invitations enable row level security;

drop policy if exists "support_technician_invitations_super_admin_all" on public.support_technician_invitations;
create policy "support_technician_invitations_super_admin_all"
  on public.support_technician_invitations
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

drop policy if exists "support_technician_invitations_select_self" on public.support_technician_invitations;
create policy "support_technician_invitations_select_self"
  on public.support_technician_invitations
  for select
  to authenticated
  using (
    status = 'pending'
    and lower(email) = lower((auth.jwt() ->> 'email')::text)
  );

drop policy if exists "support_technician_invitations_update_self" on public.support_technician_invitations;
create policy "support_technician_invitations_update_self"
  on public.support_technician_invitations
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
