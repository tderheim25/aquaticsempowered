# RBAC and tiers

## Roles (`user_role`)

- `super_admin` — platform operator (future admin console).
- `org_admin` — facility administrator.
- `manager` — operations lead.
- `staff` — default for new signups until onboarding assigns org/role.
- `vendor` — partner portal (future).

## Plans (`plan_code`)

- `free` — community preview features.
- `essential` — logs + SOPs + support portal.
- `pro` — audits + procurement + vendor guidance.
- `enterprise` — monitoring + advisory.

## App gating

- **Middleware:** protects `/app/**` (must be signed in).
- **Feature flags:** `src/lib/auth/plans.ts` maps `PLAN_FEATURES` for future route-level gating (MVP: permissive defaults; tighten per feature PR).
