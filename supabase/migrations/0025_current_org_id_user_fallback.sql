-- When the access-token hook has not run (or the session is stale), JWT org_id may be null
-- even though public.users.org_id is set. Fall back to the authenticated user's row so
-- org-scoped RLS (pools, chemical logs, etc.) still works.

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

grant execute on function public.current_org_id() to authenticated;
