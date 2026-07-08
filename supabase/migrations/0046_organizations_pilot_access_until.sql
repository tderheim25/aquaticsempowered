-- Complimentary pilot access end date (app downgrades when exceeded).
alter table public.organizations
  add column if not exists pilot_access_until timestamptz;

comment on column public.organizations.pilot_access_until is
  'Complimentary pilot access end; app downgrades plan when now() exceeds this.';

create index if not exists organizations_pilot_access_until_idx
  on public.organizations (pilot_access_until)
  where pilot_access_until is not null;
