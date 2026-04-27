# Contributing

We follow **GitHub Flow**: short-lived feature branches, PRs into `main`, squash merge, delete branch.

## Branch naming

- `feat/<area>-<short>` — new product work (e.g. `feat/chemical-logs`)
- `fix/<short>` — bug fixes
- `chore/<short>` — tooling, CI, docs

## PR checklist

1. Branch from up-to-date `main`.
2. Keep PRs small and focused (one feature or vertical slice).
3. `npm run lint` and `npm run typecheck` pass locally.
4. Request review from the other developer; **one approval** required before merge (when branch protection is on).
5. Vercel preview should be green.

## Ownership (2-person team)

- **Dev A (product / UX / DB ops):** Supabase SQL in dashboard, MUI pages, founder funnel, dashboard shell UI.
- **Dev B (platform / infra):** Next.js wiring, Supabase clients, middleware, Resend, CI/CD, server actions.

Shared: `src/lib/auth/*`, `src/types/database.ts`, `docs/*`, env vars in Vercel.

## Database migrations

Author SQL under `supabase/migrations/`. Run in Supabase SQL editor in numeric order, then regenerate types:

```bash
npx supabase gen types typescript --project-id <ID> > src/types/database.ts
```
