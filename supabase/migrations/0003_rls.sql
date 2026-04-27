-- Run AFTER 0002_functions.sql — Row Level Security

-- ---------------------------------------------------------------------------
-- plans: readable by everyone
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;

create policy "plans_select_all" on public.plans
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "orgs_select_member_or_super" on public.organizations
  for select
  using (
    public.current_role() = 'super_admin'
    or id = public.current_org_id()
  );

create policy "orgs_insert_super" on public.organizations
  for insert
  with check (public.current_role() = 'super_admin');

create policy "orgs_update_member_admin_or_super" on public.organizations
  for update
  using (
    public.current_role() = 'super_admin'
    or (
      id = public.current_org_id()
      and public.current_role() in ('org_admin', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select_self_or_same_org_or_super" on public.users
  for select
  using (
    public.current_role() = 'super_admin'
    or id = auth.uid()
    or (
      org_id is not null
      and org_id = public.current_org_id()
    )
  );

create policy "users_update_self" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_org" on public.subscriptions
  for select
  using (
    public.current_role() = 'super_admin'
    or org_id = public.current_org_id()
  );

create policy "subscriptions_write_super" on public.subscriptions
  for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- chemical_logs
-- ---------------------------------------------------------------------------
alter table public.chemical_logs enable row level security;

create policy "chemical_logs_select_org" on public.chemical_logs
  for select
  using (org_id = public.current_org_id());

create policy "chemical_logs_write_org" on public.chemical_logs
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- maintenance_tasks
-- ---------------------------------------------------------------------------
alter table public.maintenance_tasks enable row level security;

create policy "maint_select_org" on public.maintenance_tasks
  for select
  using (org_id = public.current_org_id());

create policy "maint_write_org" on public.maintenance_tasks
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
alter table public.support_tickets enable row level security;

create policy "tickets_select_org" on public.support_tickets
  for select
  using (org_id = public.current_org_id());

create policy "tickets_write_org" on public.support_tickets
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- sensor_readings
-- ---------------------------------------------------------------------------
alter table public.sensor_readings enable row level security;

create policy "sensor_select_org" on public.sensor_readings
  for select
  using (org_id = public.current_org_id());

create policy "sensor_write_org" on public.sensor_readings
  for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- vendors (global directory)
-- ---------------------------------------------------------------------------
alter table public.vendors enable row level security;

create policy "vendors_select_visible" on public.vendors
  for select
  using (
    listing_visible = true
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
  );

create policy "vendors_write_super" on public.vendors
  for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- leads (founder capture — anon insert; super_admin read)
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

create policy "leads_insert_anon" on public.leads
  for insert
  to anon
  with check (true);

create policy "leads_insert_authenticated" on public.leads
  for insert
  to authenticated
  with check (true);

create policy "leads_select_super" on public.leads
  for select
  using (public.current_role() = 'super_admin');
