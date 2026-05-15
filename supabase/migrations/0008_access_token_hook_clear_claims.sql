-- Clear stale org_id / user_role JWT claims when public.users no longer has them.
-- Run after 0002_functions.sql (or any DB that still has the old hook that only set claims when non-null).

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  uid uuid;
  u_org uuid;
  u_role public.user_role;
begin
  uid := (event->>'user_id')::uuid;
  if uid is null then
    return event;
  end if;

  select org_id, role into u_org, u_role
  from public.users
  where id = uid;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if u_org is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(u_org::text), true);
  else
    claims := claims - 'org_id';
  end if;

  if u_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(u_role::text), true);
  else
    claims := claims - 'user_role';
  end if;

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
