-- Aquatics Empowered — initial schema (run in Supabase SQL Editor first)
-- Requires: pgcrypto for gen_random_uuid()

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.org_tier as enum (
  'rural',
  'municipal',
  'hotel',
  'school',
  'hospital',
  'hoa',
  'splash_pad',
  'wellness',
  'commercial',
  'therapy'
);

create type public.user_role as enum (
  'super_admin',
  'org_admin',
  'manager',
  'staff',
  'vendor'
);

create type public.plan_code as enum (
  'free',
  'essential',
  'pro',
  'enterprise'
);

create type public.task_status as enum (
  'open',
  'in_progress',
  'done',
  'cancelled'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.ticket_status as enum (
  'open',
  'pending',
  'resolved',
  'closed'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.plans (
  code public.plan_code primary key,
  name text not null,
  monthly_cents integer not null default 0,
  annual_cents integer not null default 0,
  features jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier public.org_tier,
  address jsonb not null default '{}'::jsonb,
  plan_code public.plan_code not null default 'free' references public.plans (code),
  founder boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete set null,
  role public.user_role not null default 'staff',
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  plan_code public.plan_code not null references public.plans (code),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.chemical_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  pool_label text,
  ph numeric,
  free_chlorine numeric,
  total_chlorine numeric,
  alkalinity numeric,
  temp_f numeric,
  logged_by uuid references public.users (id),
  logged_at timestamptz not null default now()
);

create table public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'open',
  priority public.task_priority not null default 'medium',
  assigned_to uuid references public.users (id),
  due_date date,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  subject text not null,
  body text,
  status public.ticket_status not null default 'open',
  priority public.task_priority not null default 'medium',
  assigned_to uuid references public.users (id),
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text,
  category text,
  region text,
  certified_at timestamptz,
  contact jsonb not null default '{}'::jsonb,
  listing_visible boolean not null default true
);

create table public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  device_id text not null,
  metric text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  facility_tier public.org_tier not null,
  contact_name text not null,
  email text not null,
  phone text,
  num_pools integer,
  current_pain text,
  source text not null default 'founder_form',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed plans (4 tiers from blueprint)
-- ---------------------------------------------------------------------------
insert into public.plans (code, name, monthly_cents, annual_cents, features, sort_order)
values
  ('free', 'Free Community', 0, 0, '{"forum": true}'::jsonb, 0),
  ('essential', 'Essential', 14900, 142800, '{"logs": true, "sops": true}'::jsonb, 1),
  ('pro', 'Professional', 49900, 478800, '{"audits": true, "procurement": true}'::jsonb, 2),
  ('enterprise', 'Enterprise', 150000, 1500000, '{"monitoring": true, "advisory": true}'::jsonb, 3)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Auth: mirror auth.users -> public.users (MVP onboarding)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, org_id)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'staff',
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
