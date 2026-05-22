-- Fix "stack depth limit exceeded" when loading support_tickets (and other org-scoped data).
-- Cause: users RLS calls current_org_id(), which SELECTs users → infinite policy recursion.
-- Also: current_support_provider_id() SELECTs users under the same RLS.
--
-- Run once in Supabase SQL Editor after 0028_support_portal.sql.

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    nullif(
      trim(both '"' from (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')),
      ''
    )::uuid,
    (select u.org_id from public.users u where u.id = auth.uid())
  );
$$;

create or replace function public.current_support_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select u.support_provider_id
  from public.users u
  where u.id = auth.uid();
$$;

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_support_provider_id() to authenticated;
