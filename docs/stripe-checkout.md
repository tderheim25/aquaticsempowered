# Stripe Checkout

Aquatics Empowered uses **Stripe Checkout** (hosted) for subscription billing. Webhooks sync state into Supabase `subscriptions` and `organizations`.

## Environment variables

Copy from [`.env.example`](../.env.example):

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API (`sk_test_…` or restricted `rk_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side (future Elements use) |
| `STRIPE_PRICE_ESSENTIAL_MONTHLY` | Essential monthly price ID |
| `STRIPE_PRICE_ESSENTIAL_ANNUAL` | Essential annual price ID |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly price ID |
| `STRIPE_PRICE_PRO_ANNUAL` | Pro annual price ID |
| `STRIPE_PRICE_FOUNDER_ANNUAL` | Founder annual price ID |

Create matching Products/Prices in the [Stripe Dashboard](https://dashboard.stripe.com/test/products) (test mode first).

## Routes

| Route | Method | Description |
|---|---|---|
| `/api/stripe/checkout` | POST | Creates Checkout Session (`founder` or `self_serve` flow) |
| `/api/stripe/webhook` | POST | Handles Stripe events, syncs Supabase |
| `/api/stripe/portal` | POST | Opens Stripe Customer Portal for authenticated org admins |

## Webhook events

The handler in [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts) processes:

- `checkout.session.completed` — initial fulfillment after Checkout
- `customer.subscription.created` / `updated` / `deleted` — ongoing subscription state
- `invoice.paid` / `invoice.payment_failed` — reserved for future alerting

Sync logic lives in [`src/lib/stripe/syncSubscription.ts`](../src/lib/stripe/syncSubscription.ts):

- Upserts `subscriptions` by `org_id`
- Sets `organizations.plan_code` when subscription is active
- Sets `organizations.founder = true` for founder annual price
- Downgrades org to `free` when subscription is `canceled`

## Local testing with Stripe CLI

1. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli).
2. Log in: `stripe login`
3. Forward webhooks to the dev server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_…` signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

4. Start the app: `npm run dev`
5. Trigger test events:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

6. Complete a test checkout from `/pricing` (Essential/Pro) or the founder wizard.

## Verification checklist

- [ ] `subscriptions` row has `stripe_customer_id`, `stripe_subscription_id`, and `status = active`
- [ ] `organizations.plan_code` matches the purchased tier
- [ ] AE Console → **Stripe subscriptions** panel shows the synced row
- [ ] `/app/billing/success` renders after self-serve checkout
- [ ] `/founders/thanks?checkout=success` renders after founder checkout
- [ ] Customer Portal opens from **Manage billing** on the success page

## Notes

- Do **not** pass `payment_method_types` on Checkout Sessions — Stripe selects payment methods dynamically.
- Webhooks are the source of truth; success pages are optimistic UI only.
- If Stripe env vars are missing, pricing CTAs fall back to `/founders` and checkout API returns `503`.
