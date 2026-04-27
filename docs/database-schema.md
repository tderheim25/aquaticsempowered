# Database schema (MVP)

Run migrations in order in the Supabase SQL editor:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_functions.sql`
3. `supabase/migrations/0003_rls.sql`

Then enable **Authentication → Hooks → Customize Access Token** → `public.custom_access_token_hook`.

## Tables

| Table | Purpose |
| --- | --- |
| `plans` | Plan catalog (`free`, `essential`, `pro`, `enterprise`) |
| `organizations` | Facility / tenant |
| `users` | Profile linked 1:1 to `auth.users` |
| `subscriptions` | Stripe subscription mirror (post-MVP wiring) |
| `chemical_logs` | Water chemistry readings |
| `maintenance_tasks` | Work orders |
| `support_tickets` | Helpdesk |
| `vendors` | Global partner directory |
| `sensor_readings` | IoT forward-compat |
| `leads` | Founder / marketing capture |

## Enums

`org_tier`, `user_role`, `plan_code`, `task_status`, `task_priority`, `ticket_status`
