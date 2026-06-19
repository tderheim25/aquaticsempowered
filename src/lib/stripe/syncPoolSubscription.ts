import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { getPoolLicenseSnapshot, syncPoolLicenseQuantityFromStripe } from "@/lib/billing/poolLicenses";
import { isBillingActive, normalizeSubscriptionStatus } from "@/lib/billing/subscriptionSummary";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripePoolAddonPriceId,
  isBasePlanSubscriptionItem,
  isPoolAddonPriceId,
} from "@/lib/stripe/prices";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { embeddedCheckoutUiMode } from "@/lib/stripe/stripeApiCompat";
import { syncOrgBillingFromStripe } from "@/lib/stripe/syncSubscription";
import { captureException } from "@/lib/sentry";
import type { PlanCode } from "@/types/database";
import type Stripe from "stripe";

export type PoolLicensePurchaseResult =
  | { ok: true; purchased: number }
  | { ok: false; code: "payment_required"; clientSecret: string }
  | {
      ok: false;
      code:
        | "not_configured"
        | "no_active_subscription"
        | "pool_addon_not_configured"
        | "stripe_subscription_missing"
        | "invalid_quantity";
      error: string;
    };

export type PoolLicenseReleaseResult =
  | { ok: true; purchased: number; released: number }
  | {
      ok: false;
      code:
        | "insufficient_addons"
        | "not_configured"
        | "no_active_subscription"
        | "pool_addon_not_configured"
        | "stripe_subscription_missing";
      error: string;
    };

type PoolAddonBillingContext =
  | {
      ok: true;
      billingRootId: string;
      subscription: Stripe.Subscription;
      customerId: string | null;
    }
  | {
      ok: false;
      code:
        | "no_active_subscription"
        | "pool_addon_not_configured"
        | "stripe_subscription_missing";
      error: string;
    };

function findPoolAddonItem(subscription: Stripe.Subscription) {
  const poolAddonPriceId = getStripePoolAddonPriceId();
  return subscription.items.data.find(
    (item) =>
      item.metadata?.type === "pool_addon" ||
      (poolAddonPriceId && item.price?.id === poolAddonPriceId),
  );
}

function findBasePlanItem(subscription: Stripe.Subscription) {
  return subscription.items.data.find((item) => isBasePlanSubscriptionItem(item));
}

async function resolvePoolAddonBillingContext(
  billingRootId: string,
  options?: { retrySync?: boolean },
): Promise<PoolAddonBillingContext> {
  const poolAddonPriceId = getStripePoolAddonPriceId();
  if (!poolAddonPriceId || !isStripeConfigured()) {
    return {
      ok: false,
      code: "pool_addon_not_configured",
      error:
        "Pool add-on billing is not configured. Add STRIPE_PRICE_POOL_ADDON_MONTHLY to enable purchases.",
    };
  }

  const admin = createAdminClient();
  let { data: sub } = await admin
    .from("subscriptions")
    .select("plan_code, stripe_subscription_id, stripe_customer_id, status")
    .eq("org_id", billingRootId)
    .maybeSingle();

  if (!sub) {
    return {
      ok: false,
      code: "no_active_subscription",
      error: "An active subscription is required before purchasing pool add-ons.",
    };
  }

  const planCode = (sub.plan_code as PlanCode) ?? "free";
  if (planCode === "free") {
    return {
      ok: false,
      code: "no_active_subscription",
      error: "Subscribe to a paid plan before purchasing pool add-ons.",
    };
  }

  const normalizedStatus = normalizeSubscriptionStatus(sub.status);
  if (!isBillingActive(normalizedStatus)) {
    return {
      ok: false,
      code: "no_active_subscription",
      error: "An active subscription is required before purchasing pool add-ons.",
    };
  }

  if (!sub.stripe_subscription_id) {
    if (options?.retrySync !== false) {
      await syncOrgBillingFromStripe(billingRootId);
      return resolvePoolAddonBillingContext(billingRootId, { retrySync: false });
    }
    return {
      ok: false,
      code: "stripe_subscription_missing",
      error: "Billing is still syncing. Refresh the page and try again.",
    };
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  return {
    ok: true,
    billingRootId,
    subscription,
    customerId: sub.stripe_customer_id,
  };
}
async function updatePoolLicenseQuantity(
  billingRootId: string,
  subscription: Stripe.Subscription,
  nextQuantity: number,
): Promise<PoolLicensePurchaseResult> {
  const poolAddonPriceId = getStripePoolAddonPriceId();
  if (!poolAddonPriceId) {
    return { ok: false, code: "not_configured", error: "Pool add-on price is not configured." };
  }

  const stripe = getStripe();
  const poolItem = findPoolAddonItem(subscription);
  const items: Stripe.SubscriptionUpdateParams.Item[] = [];

  if (poolItem) {
    if (nextQuantity === 0) {
      items.push({ id: poolItem.id, deleted: true });
    } else {
      items.push({ id: poolItem.id, quantity: nextQuantity });
    }
  } else if (nextQuantity > 0) {
    items.push({
      price: poolAddonPriceId,
      quantity: nextQuantity,
      metadata: { type: "pool_addon" },
    });
  } else {
    await syncPoolLicenseQuantityFromStripe(billingRootId, subscription);
    return { ok: true, purchased: 0 };
  }

  const updated = await stripe.subscriptions.update(subscription.id, {
    items,
    proration_behavior: "create_prorations",
    expand: ["latest_invoice"],
  });

  await syncPoolLicenseQuantityFromStripe(billingRootId, updated);

  const latestInvoice = updated.latest_invoice;
  if (latestInvoice && typeof latestInvoice !== "string") {
    if (latestInvoice.status === "open" && latestInvoice.amount_due > 0) {
      try {
        await stripe.invoices.pay(latestInvoice.id);
        return { ok: true, purchased: nextQuantity };
      } catch (payError) {
        captureException(payError, { step: "pool_license_invoice_pay", billingRootId });
        const siteUrl = getSiteUrl();
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          ui_mode: embeddedCheckoutUiMode(),
          customer:
            typeof updated.customer === "string" ? updated.customer : updated.customer?.id,
          invoice: latestInvoice.id,
          return_url: `${siteUrl}/app/billing?pool_licenses=success`,
        } as Stripe.Checkout.SessionCreateParams);
        if (!session.client_secret) {
          return {
            ok: false,
            code: "not_configured",
            error: "Could not start payment for pool add-ons.",
          };
        }
        return { ok: false, code: "payment_required", clientSecret: session.client_secret };
      }
    }
  }

  return { ok: true, purchased: nextQuantity };
}

export async function purchasePoolLicenses(
  orgId: string,
  quantity: number,
): Promise<PoolLicensePurchaseResult> {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, code: "invalid_quantity", error: "Quantity must be at least 1." };
  }

  const billingRootId = await resolveBillingRootOrgId(orgId);
  const ctx = await resolvePoolAddonBillingContext(billingRootId);
  if (!ctx.ok) {
    return { ok: false, code: ctx.code, error: ctx.error };
  }

  const snapshot = await getPoolLicenseSnapshot(billingRootId);
  const nextQuantity = snapshot.purchased + quantity;

  try {
    return await updatePoolLicenseQuantity(billingRootId, ctx.subscription, nextQuantity);
  } catch (error) {
    captureException(error, { step: "purchase_pool_licenses", billingRootId, quantity });
    return {
      ok: false,
      code: "not_configured",
      error: "Could not update pool add-ons. Try again or update your payment method.",
    };
  }
}
export async function releasePoolLicenses(
  orgId: string,
  quantity: number,
): Promise<PoolLicenseReleaseResult> {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, code: "insufficient_addons", error: "Quantity must be at least 1." };
  }

  const billingRootId = await resolveBillingRootOrgId(orgId);
  const snapshot = await getPoolLicenseSnapshot(billingRootId);
  if (snapshot.available < quantity) {
    return {
      ok: false,
      code: "insufficient_addons",
      error: `Only ${snapshot.available} unused pool add-on${snapshot.available === 1 ? "" : "s"} available to release.`,
    };
  }

  const ctx = await resolvePoolAddonBillingContext(billingRootId);
  if (!ctx.ok) {
    return { ok: false, code: ctx.code, error: ctx.error };
  }

  const nextQuantity = Math.max(0, snapshot.purchased - quantity);

  try {
    const result = await updatePoolLicenseQuantity(billingRootId, ctx.subscription, nextQuantity);
    if (!result.ok) {
      return {
        ok: false,
        code: "not_configured",
        error:
          result.code === "payment_required"
            ? "Complete payment to release pool add-ons."
            : "error" in result
              ? result.error
              : "Could not release pool add-ons.",
      };
    }
    return { ok: true, purchased: result.purchased, released: quantity };
  } catch (error) {
    captureException(error, { step: "release_pool_licenses", billingRootId, quantity });
    return {
      ok: false,
      code: "not_configured",
      error: "Could not release pool add-ons. Try again later.",
    };
  }
}
/** Count active pools for checkout initial add-on quantity (account-wide). */
export async function getPoolAddonQuantityForOrg(orgId: string): Promise<number> {
  const billingRootId = await resolveBillingRootOrgId(orgId);
  const snapshot = await getPoolLicenseSnapshot(billingRootId);
  return snapshot.purchased;
}

export { findBasePlanItem, findPoolAddonItem, isPoolAddonPriceId };
