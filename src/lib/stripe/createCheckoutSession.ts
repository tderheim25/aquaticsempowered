import "server-only";

import { resolveCheckoutDiscount } from "@/lib/marketing/sitePromo";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripePriceId,
  getStripePoolAddonPriceId,
  type BillingCadence,
  type CheckoutFlow,
} from "@/lib/stripe/prices";
import { getSiteUrl, getStripe } from "@/lib/stripe/server";
import { embeddedCheckoutUiMode } from "@/lib/stripe/stripeApiCompat";
import { getPoolAddonQuantityForOrg } from "@/lib/stripe/syncPoolSubscription";
import type { PlanCode } from "@/types/database";

export type CreateCheckoutSessionInput = {
  orgId: string;
  email: string;
  planCode: PlanCode;
  cadence: BillingCadence;
  flow: CheckoutFlow;
  promoCode?: string;
  embedded?: boolean;
};

export type CreateCheckoutSessionResult =
  | { ok: true; embedded: true; clientSecret: string }
  | { ok: true; embedded: false; url: string }
  | { ok: false; error: string; code?: string };

async function getOrCreateStripeCustomer(orgId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    return existingSub.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { org_id: orgId },
  });

  if (existingSub?.id) {
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("id", existingSub.id);
  } else {
    await admin.from("subscriptions").insert({
      org_id: orgId,
      plan_code: "free",
      status: "inactive",
      stripe_customer_id: customer.id,
    });
  }

  return customer.id;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  const { orgId, email, planCode, cadence, flow, promoCode, embedded = true } = input;

  if (flow === "founder" && planCode !== "essential" && planCode !== "pro") {
    return { ok: false, error: "Founder checkout requires Essential or Professional." };
  }

  const priceId = getStripePriceId(planCode, cadence, flow);
  const poolAddonPriceId = getStripePoolAddonPriceId();
  const poolAddonQty = await getPoolAddonQuantityForOrg(orgId);

  if (!priceId) {
    return {
      ok: false,
      code: "price_not_configured",
      error: `Billing is not configured for ${planCode} (${cadence}). Add the Stripe price ID to your server environment.`,
    };
  }

  try {
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const stripeCustomerId = await getOrCreateStripeCustomer(orgId, email);

    const discount = await resolveCheckoutDiscount({
      planCode,
      flow,
      promoCode,
    });

    const stripeDiscounts =
      discount.stripeDiscount?.type === "coupon"
        ? [{ coupon: discount.stripeDiscount.couponId }]
        : discount.stripeDiscount?.type === "promotion_code"
          ? [{ promotion_code: discount.stripeDiscount.promotionCodeId }]
          : undefined;

    const lineItems: { price: string; quantity: number }[] = [{ price: priceId, quantity: 1 }];
    if (poolAddonPriceId && poolAddonQty > 0) {
      lineItems.push({ price: poolAddonPriceId, quantity: poolAddonQty });
    }

    const founderReturnUrl = `${siteUrl}/founders/thanks?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const selfServeReturnUrl = `${siteUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const returnUrl = flow === "founder" ? founderReturnUrl : selfServeReturnUrl;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: orgId,
      line_items: lineItems,
      ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
      metadata: {
        org_id: orgId,
        plan_code: planCode,
        flow,
        ...(promoCode?.trim() ? { promo_code: promoCode.trim().toUpperCase() } : {}),
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          plan_code: planCode,
          flow,
        },
      },
      ...(embedded
        ? {
            ui_mode: embeddedCheckoutUiMode(),
            return_url: returnUrl,
          }
        : {
            success_url: returnUrl,
            cancel_url:
              flow === "founder"
                ? `${siteUrl}/founders?checkout=canceled`
                : `${siteUrl}/app/billing?checkout=canceled`,
          }),
    });

    if (embedded) {
      if (!session.client_secret) {
        return { ok: false, error: "Could not create checkout session" };
      }
      return { ok: true, embedded: true, clientSecret: session.client_secret };
    }

    if (!session.url) {
      return { ok: false, error: "Could not create checkout session" };
    }

    return { ok: true, embedded: false, url: session.url };
  } catch (error) {
    captureException(error, { step: "stripe_checkout_create", orgId });
    return { ok: false, error: "Failed to start checkout" };
  }
}
