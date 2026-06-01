-- Troy final public list pricing: $0 / $399 / $699 per month (Essential / Professional).
-- annual_cents = annual prepay total (~17% vs paying monthly × 12).

update public.plans
set
  monthly_cents = 39900,
  annual_cents = 397600
where code = 'essential';

update public.plans
set
  monthly_cents = 69900,
  annual_cents = 697200
where code = 'pro';
