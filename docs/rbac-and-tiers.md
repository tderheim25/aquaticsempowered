# RBAC and tiers

## Two layers: JWT enum vs app roles

Aquatics Empowered separates **authorization** (Postgres `user_role` enum → JWT → RLS) from **display and navigation** (`app_roles` + `app_role_view_permissions`).

| Layer | Purpose |
|-------|---------|
| `users.role` (`user_role` enum) | JWT claims, RLS policies, `requireRole()` checks |
| `users.app_role_id` → `app_roles` | Human-readable labels, dashboard view matrix |
| `organizations.plan_code` | Feature flags via `PLAN_FEATURES` in `src/lib/auth/plans.ts` |

Plan owners always keep `users.role = org_admin` for RLS. Their visible role comes from `app_roles` (e.g. **Essential Owner**).

## Roles (`user_role` enum)

- `super_admin` — platform operator (AE Console).
- `org_admin` — organization owner JWT base (not shown as “Org Admin” in UI).
- `manager` — operations lead; can be promoted from Staff.
- `staff` — default for invited teammates and removed members.
- `vendor` — partner portal.
- `support_technician` — support provider portal.

## App roles (`app_roles`)

| Situation | `users.role` | `app_roles.slug` | Display label |
|-----------|--------------|------------------|---------------|
| Free signup / no org | `staff` | `default_user` | Default User |
| Essential plan owner | `org_admin` | `essential_owner` | Essential Owner |
| Professional plan owner | `org_admin` | `professional_owner` | Professional Owner |
| Enterprise plan owner | `org_admin` | `enterprise_owner` | Enterprise Owner |
| Invited teammate | `staff` | `staff` | Staff |
| Promoted teammate | `manager` | `manager` | Manager |

The legacy `org_admin` app role row is deprecated (`org_admin_legacy`) after migration `0043_plan_based_app_roles.sql`.

## Plans (`plan_code`)

- `free` — community + vendor directory (Default User).
- `essential` — logs, pools, maintenance, support, training.
- `pro` — essential + procurement, energy audits, chemistry tools.
- `enterprise` — full feature set including monitoring.

## Auto-sync on plan change

When Stripe updates `organizations.plan_code`, `syncOwnerAppRoleForOrg()` in `src/lib/auth/planOwnerRoles.ts` reassigns owner `app_role_id` to match the plan (e.g. Essential → Professional upgrades the label to **Professional Owner**). JWT role stays `org_admin`.

Assignment also runs on founder wizard org creation and facility creation.

## Team invites

Org owners invite **Staff** (default) or **Manager** only. `org_admin` is not offered in the invite UI — each billing account has plan-branded owners, not generic org admins.

## Founder tagging

Founder program enrollments are tagged separately from self-serve checkout:

| Field | Scope |
|-------|--------|
| `organizations.founder` | Billing root retains founder pricing |
| `users.is_founder` | User enrolled via founder wizard |
| `users.founder_enrolled_at` | When the founder tag was set |

Rules:

- Set on **founder wizard** (`founder_account`) only — not self-serve Stripe checkout.
- Persists across plan upgrades (Essential → Pro keeps founder status).
- AE Console **Users** table shows a Founder column and filter.

## App gating

- **Middleware:** protects `/app/**` (must be signed in).
- **View permissions:** `getAllowedViewsForProfile()` reads `app_role_view_permissions`; owner roles are seeded per tier in migration 0043.
- **Feature flags:** `hasFeature(plan, feature)` enforces plan limits even if a view is visible.

## Super admin

AE Console can edit `app_roles` labels and view permissions. Changing an owner’s plan in Stripe or the org record triggers auto-sync for owner app roles.
