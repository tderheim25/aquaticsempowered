-- Founder promo: site-wide toggle + gift codes for 50% off Professional subscriptions.

insert into public.platform_settings (key, value, description)
values (
  'site_promo',
  '{"active": true}'::jsonb,
  'Site-wide 50% founder/pricing promo toggle (new signups only; existing subscribers grandfathered).'
)
on conflict (key) do nothing;

create table if not exists public.founder_promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  stripe_promotion_code_id text not null,
  stripe_coupon_id text not null,
  percent_off int not null default 50,
  active boolean not null default true,
  max_redemptions int,
  times_redeemed int not null default 0,
  expires_at timestamptz,
  note text,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create index if not exists founder_promo_codes_active_idx
  on public.founder_promo_codes (active, created_at desc);

alter table public.founder_promo_codes enable row level security;

drop policy if exists "founder_promo_codes_select_super" on public.founder_promo_codes;
create policy "founder_promo_codes_select_super"
  on public.founder_promo_codes
  for select
  to authenticated
  using (public.current_role() = 'super_admin');

drop policy if exists "founder_promo_codes_write_super" on public.founder_promo_codes;
create policy "founder_promo_codes_write_super"
  on public.founder_promo_codes
  for all
  to authenticated
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');
