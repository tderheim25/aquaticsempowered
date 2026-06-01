-- Energy audits (org-scoped). Beta program; Professional tier when billing enforced.

create type public.energy_audit_status as enum ('draft', 'submitted', 'completed');

create table if not exists public.energy_audits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pool_id uuid references public.pools (id) on delete set null,
  title text not null,
  status public.energy_audit_status not null default 'draft',
  facility_summary text,
  pump_notes text,
  heater_notes text,
  schedule_notes text,
  findings text,
  recommendations text,
  estimated_savings_notes text,
  created_by uuid references public.users (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint energy_audits_title_nonempty check (char_length(trim(title)) > 0)
);

create index if not exists energy_audits_org_created_idx on public.energy_audits (org_id, created_at desc);

alter table public.energy_audits enable row level security;

drop policy if exists "energy_audits_select_own_org" on public.energy_audits;
create policy "energy_audits_select_own_org"
  on public.energy_audits for select
  using (org_id = public.current_org_id());

drop policy if exists "energy_audits_write_own_org" on public.energy_audits;
create policy "energy_audits_write_own_org"
  on public.energy_audits for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
