# Stripe billing (embedded checkout + pool licenses)

Aquatics Empowered uses **Stripe Embedded Checkout** for in-page subscription payments. Webhooks sync state into Supabase `subscriptions` and `organizations`. Pool add-ons use a **license inventory** model (buy in advance or pay when adding a pool).

## Environment variables

Copy from [`.env.example`](../.env.example):

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API (`sk_test_…` or restricted `rk_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required for Embedded Checkout (`pk_test_…`) |
| `STRIPE_PRICE_ESSENTIAL_MONTHLY` | Essential monthly price ID |
| `STRIPE_PRICE_ESSENTIAL_ANNUAL` | Essential annual price ID |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly price ID |
| `STRIPE_PRICE_PRO_ANNUAL` | Pro annual price ID |
| `STRIPE_PRICE_POOL_ADDON_MONTHLY` | Pool license add-on ($29/mo per license) |
| `STRIPE_PROMO_COUPON_ID` | Founder 50% coupon (`ae_founder_launch_50_3y` — 36 months) |

Sync products, prices, and coupon:

```bash
npm run stripe:sync-catalog          # dry-run
npm run stripe:sync-catalog:apply      # write to Stripe + print env lines
```

Founder checkout uses **Professional or Essential monthly** with the site-wide founder coupon when active.

## Routes

| Route | Method | Description |
|---|---|---|
| `/api/stripe/checkout` | POST | Creates Checkout Session (`embedded: true` → `ui_mode: embedded_page`, returns `clientSecret`) |
| `/api/stripe/webhook` | POST | Stripe events → Supabase sync |
| `/api/stripe/portal` | POST | Stripe Customer Portal |
| `/api/stripe/change-plan` | POST | Swap base plan on existing subscription |
| `/api/stripe/pool-licenses/purchase` | POST | Buy pool licenses (may return embedded payment `clientSecret`) |
| `/api/stripe/pool-licenses/release` | POST | Release unused pool licenses |
| `/api/billing/pool-licenses` | GET | License snapshot (purchased / assigned / available) |

## Embedded checkout surfaces

Checkout sessions use Stripe `ui_mode: embedded_page` (see [`stripeApiCompat.ts`](../src/lib/stripe/stripeApiCompat.ts)).

- Founder wizard — modal checkout after account creation
- `/app/billing` — modal subscription checkout (`?checkout=1` auto-opens when payment is pending)
- `/pricing` — checkout in a shared modal dialog
- Pool licenses — modal payment when a license purchase requires card confirmation

Successful payments show confetti in the modal, then redirect to success pages that also celebrate on direct landings.

Checkout `mode: subscription` saves the payment method on the Stripe Customer for **automatic monthly or annual renewal**.

## Pool licenses

| Term | Meaning |
|---|---|
| **Included** | First active pool per billing account |
| **Purchased** | Stripe pool add-on line item quantity |
| **Assigned** | Billable active pools in use |
| **Available** | Purchased − assigned (prepaid unused slots) |

- Buy licenses from **Billing** or when adding a pool without an available license.
- Removing a pool frees a license slot; **release** unused licenses on Billing to stop paying for them.
- All pool licenses renew on the **same date** as the base subscription (Stripe prorates mid-cycle changes).

## Webhook events

Handled in [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts):

- `checkout.session.completed`
- `customer.subscription.created` / `updated` / `deleted`
- `invoice.paid` / `invoice.payment_failed`

Sync logic: [`src/lib/stripe/syncSubscription.ts`](../src/lib/stripe/syncSubscription.ts)

## Local testing

1. Install [Stripe CLI](https://docs.stripe.com/stripe-cli) and run `stripe login`
2. Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy `whsec_…` into `.env.local` as `STRIPE_WEBHOOK_SECRET`
4. Run `npm run dev`
5. Complete embedded checkout from `/founders` or `/app/billing`

## Verification checklist

- [ ] `subscriptions` row: `stripe_customer_id`, `stripe_subscription_id`, `status = active`, `pool_license_quantity`
- [ ] `organizations.plan_code` matches purchased tier
- [ ] Founder modal checkout completes without leaving the page
- [ ] Pool add blocked without license; purchase + add works
- [ ] Release unused license decreases Stripe pool add-on quantity
- [ ] Customer Portal opens from **Manage billing**

## Notes

- Do **not** pass `payment_method_types` on Checkout Sessions.
- Webhooks are the source of truth; success pages are optimistic UI.
- Founder coupon is **50% off base plan for 36 monthly cycles**; pool add-ons bill at full $29/mo.
