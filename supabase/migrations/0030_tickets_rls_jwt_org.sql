-- Prefer JWT org_id for ticket org match (avoids current_org_id → users recursion when 0029 not applied).
-- Run after 0029_fix_rls_stack_depth.sql.

drop policy if exists "tickets_select_scope" on public.support_tickets;

create policy "tickets_select_scope"
  on public.support_tickets
  for select
  to authenticated
  using (
    public.current_role() = 'super_admin'
    or created_by = auth.uid()
    or (
      org_id is not null
      and (
        org_id = nullif(
          trim(both '"' from (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')),
          ''
        )::uuid
        or org_id = public.current_org_id()
      )
    )
    or (
      public.current_role() = 'support_technician'
      and (
        assigned_support_provider_id = public.current_support_provider_id()
        or (
          status = 'open'
          and assigned_support_provider_id is null
        )
      )
    )
  );
