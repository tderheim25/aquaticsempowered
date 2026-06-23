-- Run in Supabase SQL Editor if migration 0042 has not been applied.
-- Fixes: PGRST204 on subscriptions.pool_license_quantity during Stripe checkout sync.

alter table public.subscriptions
  add column if not exists pool_license_quantity integer not null default 0;

comment on column public.subscriptions.pool_license_quantity is
  'Stripe pool add-on line item quantity (purchased licenses). Synced from webhooks; source of truth is Stripe.';
