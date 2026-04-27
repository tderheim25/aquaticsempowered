# Release v0.1.0-mvp

**Aquatics Empowered** — initial MVP foundation.

## Includes

- Next.js 15 App Router + MUI + Emotion + TypeScript
- Supabase migrations (`0001`–`0003`): schema, JWT hook helpers, RLS
- Magic-link auth (`/login`, `/signup`, `/forgot`, `/check-email`, `/callback`)
- Marketing site: `/`, `/pricing`, `/vendors`, `/community`, founder funnel `/founders` + `/founders/thanks`
- Founder lead capture → `public.leads` + Resend welcome email (when API keys set)
- Auth-gated dashboard shell at `/app` with navigation stubs
- GitHub Actions CI (lint, typecheck, build) with placeholder env for green builds
- Docs: architecture, database schema, RBAC, auth flow

## Post-MVP

Per-feature branches: chemical logs, maintenance, Stripe checkout, vendor portal, IoT, etc.

## Tag

```bash
git tag -a v0.1.0-mvp -m "MVP foundation"
git push origin v0.1.0-mvp
```
