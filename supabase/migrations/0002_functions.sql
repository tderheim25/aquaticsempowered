-- Run AFTER 0001_init.sql — helpers + JWT custom claims hook (Supabase Dashboard → Auth Hooks)

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(
    trim(both '"' from (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')),
    ''
  )::uuid;
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select nullif(
    trim(both '"' from (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')),
    ''
  );
$$;

-- Custom Access Token Hook: inject org_id + user_role from public.users into JWT claims.
-- After migration: Supabase Dashboard → Authentication → Hooks → Customize Access Token →
-- select public.custom_access_token_hook
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
  end if;

  if u_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(u_role::text), true);
  end if;

  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
