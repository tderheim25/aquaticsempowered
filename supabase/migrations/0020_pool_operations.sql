-- Pool Operations: pools registry, cleaning/inspection logs, equipment, pool_id FKs

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.pool_type as enum ('chlorine', 'saltwater', 'bromine');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pool_status as enum ('active', 'seasonal', 'inactive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.equipment_kind as enum ('pump', 'heater', 'filter', 'timer', 'other');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- pools
-- ---------------------------------------------------------------------------
create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  pool_type public.pool_type not null default 'chlorine',
  volume_gallons numeric,
  location_label text,
  notes text,
  status public.pool_status not null default 'active',
  target_ranges jsonb not null default '{}'::jsonb,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pools_org on public.pools (org_id);
create index if not exists idx_pools_org_name on public.pools (org_id, name);

create or replace function public.pools_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pools_set_updated_at on public.pools;
create trigger pools_set_updated_at
  before update on public.pools
  for each row execute procedure public.pools_set_updated_at();

-- ---------------------------------------------------------------------------
-- pool_equipment
-- ---------------------------------------------------------------------------
create table if not exists public.pool_equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pool_id uuid not null references public.pools (id) on delete cascade,
  kind public.equipment_kind not null default 'other',
  model text,
  installed_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pool_equipment_pool on public.pool_equipment (pool_id);

create or replace function public.pool_equipment_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pool_equipment_set_updated_at on public.pool_equipment;
create trigger pool_equipment_set_updated_at
  before update on public.pool_equipment
  for each row execute procedure public.pool_equipment_set_updated_at();

-- ---------------------------------------------------------------------------
-- cleaning_logs
-- ---------------------------------------------------------------------------
create table if not exists public.cleaning_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pool_id uuid not null references public.pools (id) on delete cascade,
  cleaned_at timestamptz not null default now(),
  brush boolean not null default false,
  net boolean not null default false,
  vacuum boolean not null default false,
  skimmer_basket boolean not null default false,
  pump_basket boolean not null default false,
  pump_filter boolean not null default false,
  deck boolean not null default false,
  notes text,
  logged_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cleaning_logs_org_pool on public.cleaning_logs (org_id, pool_id, cleaned_at desc);

-- ---------------------------------------------------------------------------
-- inspection_logs
-- ---------------------------------------------------------------------------
create table if not exists public.inspection_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pool_id uuid not null references public.pools (id) on delete cascade,
  inspected_at timestamptz not null default now(),
  template_key text not null,
  checklist jsonb not null default '[]'::jsonb,
  passed boolean,
  notes text,
  operator_initials text,
  logged_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inspection_logs_org_pool on public.inspection_logs (org_id, pool_id, inspected_at desc);

-- ---------------------------------------------------------------------------
-- Alter existing tables
-- ---------------------------------------------------------------------------
alter table public.chemical_logs
  add column if not exists pool_id uuid references public.pools (id) on delete set null,
  add column if not exists cyanuric_acid_ppm numeric,
  add column if not exists filter_psi numeric,
  add column if not exists flow_gpm numeric,
  add column if not exists notes text,
  add column if not exists operator_initials text;

create index if not exists idx_chemical_logs_pool on public.chemical_logs (org_id, pool_id, logged_at desc);

alter table public.maintenance_tasks
  add column if not exists pool_id uuid references public.pools (id) on delete set null;

create index if not exists idx_maintenance_tasks_pool on public.maintenance_tasks (org_id, pool_id);

alter table public.sensor_readings
  add column if not exists pool_id uuid references public.pools (id) on delete set null;

create index if not exists idx_sensor_readings_pool on public.sensor_readings (org_id, pool_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Backfill pools from pool_label
-- ---------------------------------------------------------------------------
insert into public.pools (org_id, name, created_at, updated_at)
select distinct org_id, trim(label), now(), now()
from (
  select org_id, pool_label as label from public.chemical_logs where pool_label is not null and trim(pool_label) <> ''
  union
  select org_id, pool_label as label from public.maintenance_tasks where pool_label is not null and trim(pool_label) <> ''
) labels
where not exists (
  select 1 from public.pools p
  where p.org_id = labels.org_id and lower(trim(p.name)) = lower(trim(labels.label))
);

update public.chemical_logs cl
set pool_id = p.id
from public.pools p
where cl.pool_id is null
  and cl.pool_label is not null
  and trim(cl.pool_label) <> ''
  and p.org_id = cl.org_id
  and lower(trim(p.name)) = lower(trim(cl.pool_label));

update public.maintenance_tasks mt
set pool_id = p.id
from public.pools p
where mt.pool_id is null
  and mt.pool_label is not null
  and trim(mt.pool_label) <> ''
  and p.org_id = mt.org_id
  and lower(trim(p.name)) = lower(trim(mt.pool_label));

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.pools enable row level security;
alter table public.pool_equipment enable row level security;
alter table public.cleaning_logs enable row level security;
alter table public.inspection_logs enable row level security;

drop policy if exists "pools_select_org" on public.pools;
create policy "pools_select_org" on public.pools for select using (org_id = public.current_org_id());

drop policy if exists "pools_write_org" on public.pools;
create policy "pools_write_org" on public.pools for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists "pool_equipment_select_org" on public.pool_equipment;
create policy "pool_equipment_select_org" on public.pool_equipment for select using (org_id = public.current_org_id());

drop policy if exists "pool_equipment_write_org" on public.pool_equipment;
create policy "pool_equipment_write_org" on public.pool_equipment for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists "cleaning_logs_select_org" on public.cleaning_logs;
create policy "cleaning_logs_select_org" on public.cleaning_logs for select using (org_id = public.current_org_id());

drop policy if exists "cleaning_logs_write_org" on public.cleaning_logs;
create policy "cleaning_logs_write_org" on public.cleaning_logs for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists "inspection_logs_select_org" on public.inspection_logs;
create policy "inspection_logs_select_org" on public.inspection_logs for select using (org_id = public.current_org_id());

drop policy if exists "inspection_logs_write_org" on public.inspection_logs;
create policy "inspection_logs_write_org" on public.inspection_logs for all
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- View permissions: pools
-- ---------------------------------------------------------------------------
insert into public.role_view_permissions (role, view_key, can_view)
values
  ('super_admin', 'pools', true),
  ('org_admin', 'pools', true),
  ('manager', 'pools', true),
  ('staff', 'pools', true),
  ('vendor', 'pools', false)
on conflict (role, view_key) do update set can_view = excluded.can_view;
