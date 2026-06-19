-- Billing cadence synced from Stripe base plan price interval (month/year).
alter table public.subscriptions
  add column if not exists billing_cadence text;

comment on column public.subscriptions.billing_cadence is
  'Stripe billing interval for the base plan: monthly or annual.';
