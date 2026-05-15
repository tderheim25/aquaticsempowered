-- Maintenance tasks: category, audit, pool label, timestamps, triggers, indexes

create type public.task_category as enum (
  'chemical',
  'equipment',
  'facility',
  'safety',
  'cleaning',
  'inspection',
  'other'
);

alter table public.maintenance_tasks
  add column if not exists category public.task_category not null default 'other',
  add column if not exists pool_label text,
  add column if not exists created_by uuid references public.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

-- Backfill updated_at for existing rows (if column was just added with default, already set)
update public.maintenance_tasks
set updated_at = coalesce(updated_at, created_at)
where updated_at is null;

create or replace function public.maintenance_tasks_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists maintenance_tasks_set_updated_at on public.maintenance_tasks;

create trigger maintenance_tasks_set_updated_at
  before update on public.maintenance_tasks
  for each row
  execute procedure public.maintenance_tasks_set_updated_at();

create or replace function public.maintenance_tasks_set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'done'::public.task_status then
      new.completed_at := now();
    end if;
    return new;
  end if;
  if new.status = 'done'::public.task_status and (old.status is distinct from 'done'::public.task_status) then
    new.completed_at := now();
  elsif new.status <> 'done'::public.task_status then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_tasks_set_completed_at on public.maintenance_tasks;

create trigger maintenance_tasks_set_completed_at
  before insert or update on public.maintenance_tasks
  for each row
  execute procedure public.maintenance_tasks_set_completed_at();

create index if not exists idx_maintenance_tasks_org_status
  on public.maintenance_tasks (org_id, status);

create index if not exists idx_maintenance_tasks_org_due
  on public.maintenance_tasks (org_id, due_date);

create index if not exists idx_maintenance_tasks_assigned
  on public.maintenance_tasks (assigned_to);
