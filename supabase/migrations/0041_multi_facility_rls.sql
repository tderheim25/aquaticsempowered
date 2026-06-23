-- Multi-facility: membership helper, JWT hook, RLS

-- ---------------------------------------------------------------------------
-- Helper: user has membership in org
-- ---------------------------------------------------------------------------
create or replace function public.user_has_org_membership(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.user_id = auth.uid()
      and m.org_id = target_org_id
  );
$$;

grant execute on function public.user_has_org_membership(uuid) to authenticated;
grant execute on function public.user_has_org_membership(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- JWT hook: active_org_id drives org_id claim
-- ---------------------------------------------------------------------------
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

  select coalesce(up.active_org_id, u.org_id), u.role
  into u_org, u_role
  from public.users u
  left join public.user_preferences up on up.user_id = u.id
  where u.id = uid;

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

-- ---------------------------------------------------------------------------
-- organizations: broader select for multi-facility owners
-- ---------------------------------------------------------------------------
drop policy if exists "orgs_select_member_or_super" on public.organizations;

create policy "orgs_select_member_or_super" on public.organizations
  for select
  using (
    public.current_role() = 'super_admin'
    or id = public.current_org_id()
    or public.user_has_org_membership(id)
    or billing_org_id = public.current_org_id()
  );

-- ---------------------------------------------------------------------------
-- organization_memberships RLS
-- ---------------------------------------------------------------------------
alter table public.organization_memberships enable row level security;

create policy "org_memberships_select_own_or_super" on public.organization_memberships
  for select
  using (
    public.current_role() = 'super_admin'
    or user_id = auth.uid()
  );

create policy "org_memberships_insert_service" on public.organization_memberships
  for insert
  with check (public.current_role() = 'super_admin');

create policy "org_memberships_update_service" on public.organization_memberships
  for update
  using (public.current_role() = 'super_admin');

create policy "org_memberships_delete_service" on public.organization_memberships
  for delete
  using (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- user_preferences RLS
-- ---------------------------------------------------------------------------
alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own" on public.user_preferences
  for select
  using (user_id = auth.uid() or public.current_role() = 'super_admin');

create policy "user_preferences_upsert_own" on public.user_preferences
  for insert
  with check (user_id = auth.uid() or public.current_role() = 'super_admin');

create policy "user_preferences_update_own" on public.user_preferences
  for update
  using (user_id = auth.uid() or public.current_role() = 'super_admin');
