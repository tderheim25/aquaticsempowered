# Aquatics Empowered

Operating system for aquatic facilities — MVP foundation (Next.js 15 + MUI + Supabase + Vercel).

## Quick start

```bash
cp .env.example .env.local
# Fill Supabase + Resend keys (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy [`.env.example`](./.env.example) → `.env.local`. **Required for local dev:**

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Local app URL (`http://localhost:3000` in dev) |
| `NEXT_PUBLIC_APP_URL` | Public deployed URL for **invitation emails** and auth links ([aquaticsempowered.vercel.app](https://aquaticsempowered.vercel.app)) — must not be localhost in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `SUPABASE_PROJECT_ID` | For `supabase gen types` |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key |
| `RESEND_FROM_EMAIL` | Verified sender domain |

Optional: PostHog, Sentry, Stripe — see [`.env.example`](.env.example) and [Stripe checkout setup](docs/stripe-checkout.md).

## Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_functions.sql`
   - `supabase/migrations/0003_rls.sql`
3. **Authentication → Hooks → Customize Access Token** → select `public.custom_access_token_hook`.
4. **Authentication → SMTP** → configure Resend (`smtp.resend.com`, port `465`, user `resend`, password = Resend API key).
5. **Authentication → URL configuration** → add redirect URLs:
   - `http://localhost:3000/callback`
   - Production: `https://<your-domain>/callback`

Regenerate TypeScript types after schema changes:

```bash
npx supabase gen types typescript --project-id <SUPABASE_PROJECT_ID> > src/types/database.ts
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |

## Deploy

- Connect repo to [Vercel](https://vercel.com); set the same env vars as `.env.example` for Preview + Production.
- Protect `main` in GitHub (PR + CI + review) per [CONTRIBUTING.md](./CONTRIBUTING.md).

## Screenshots

_Add marketing + dashboard screenshots here after first production deploy (Day 10 deliverable)._

## Repo

Upstream: `https://github.com/tderheim25/aquaticsempowered`

## License

Proprietary — All rights reserved.
