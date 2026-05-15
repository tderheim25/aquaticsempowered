-- Procurement requisitions (org-scoped). Apply after core schema + RLS helpers exist.

create type public.procurement_request_status as enum (
  'draft',
  'submitted',
  'in_review',
  'quoted',
  'approved',
  'ordered',
  'cancelled'
);

create table public.procurement_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'other',
  status public.procurement_request_status not null default 'submitted',
  preferred_vendor_id uuid references public.vendors (id) on delete set null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procurement_requests_title_nonempty check (char_length(trim(title)) > 0),
  constraint procurement_requests_category_allowed check (
    category in ('chemicals', 'equipment', 'parts', 'services', 'other')
  )
);

create index procurement_requests_org_created_idx on public.procurement_requests (org_id, created_at desc);

alter table public.procurement_requests enable row level security;

create policy "procurement_requests_select_own_org" on public.procurement_requests for select using (org_id = public.current_org_id());

create policy "procurement_requests_write_own_org" on public.procurement_requests for all using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
