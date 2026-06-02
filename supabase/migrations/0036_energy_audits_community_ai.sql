-- Community AI energy audits: optional org, facility-only input, AI-generated report

alter table public.energy_audits
  alter column org_id drop not null;

alter table public.energy_audits
  add column if not exists facility_name text,
  add column if not exists facility_type text,
  add column if not exists body_of_water text,
  add column if not exists size_notes text,
  add column if not exists equipment_notes text,
  add column if not exists schedule_notes text,
  add column if not exists input_payload jsonb,
  add column if not exists ai_report text,
  add column if not exists is_community_beta boolean not null default false;

create index if not exists energy_audits_community_created_idx
  on public.energy_audits (created_at desc)
  where is_community_beta = true;

drop policy if exists "energy_audits_select_own_org" on public.energy_audits;
drop policy if exists "energy_audits_write_own_org" on public.energy_audits;

-- Org members: existing org-scoped rows
create policy "energy_audits_select_org"
  on public.energy_audits for select
  using (
    org_id is not null
    and org_id = public.current_org_id()
  );

create policy "energy_audits_write_org"
  on public.energy_audits for all
  using (
    org_id is not null
    and org_id = public.current_org_id()
  )
  with check (
    org_id is not null
    and org_id = public.current_org_id()
  );

-- Community beta: creator can read their own org-less audits
create policy "energy_audits_select_own_community"
  on public.energy_audits for select
  using (
    org_id is null
    and is_community_beta = true
    and created_by = auth.uid()
  );
