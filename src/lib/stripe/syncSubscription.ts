import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { PlanCode } from "@/types/database";

import { isFounderPriceId, parsePlanCode, planCodeFromStripePriceId } from "./prices";

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function subscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const raw = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    start: raw.current_period_start
      ? new Date(raw.current_period_start * 1000).toISOString()
      : null,
    end: raw.current_period_end
      ? new Date(raw.current_period_end * 1000).toISOString()
      : null,
  };
}

function primaryPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price?.id ?? null;
}

function resolvePlanCode(subscription: Stripe.Subscription): PlanCode | null {
  const fromMetadata = parsePlanCode(subscription.metadata?.plan_code);
  if (fromMetadata) return fromMetadata;
  return planCodeFromStripePriceId(primaryPriceId(subscription));
}

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<void> {
  const orgId = subscription.metadata?.org_id?.trim();
  if (!orgId) {
    captureException(new Error("Stripe subscription missing org_id metadata"), {
      step: "stripe_sync_missing_org",
      subscriptionId: subscription.id,
    });
    return;
  }

  const planCode = resolvePlanCode(subscription);
  if (!planCode) {
    captureException(new Error("Could not resolve plan_code from Stripe subscription"), {
      step: "stripe_sync_missing_plan",
      subscriptionId: subscription.id,
      orgId,
    });
    return;
  }

  const customerId = stripeCustomerId(subscription.customer);
  const priceId = primaryPriceId(subscription);
  const founder = isFounderPriceId(priceId) || subscription.metadata?.flow === "founder";

  const admin = createAdminClient();

  const { start: periodStart, end: periodEnd } = subscriptionPeriod(subscription);

  const row = {
    org_id: orgId,
    plan_code: planCode,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("subscriptions").update(row).eq("id", existing.id);
    if (error) {
      captureException(error, { step: "stripe_sync_subscription_update", orgId });
      throw error;
    }
  } else {
    const { error } = await admin.from("subscriptions").insert(row);
    if (error) {
      captureException(error, { step: "stripe_sync_subscription_insert", orgId });
      throw error;
    }
  }

  const activeStatuses = new Set(["active", "trialing"]);
  const orgUpdate: { plan_code?: PlanCode; founder?: boolean } = {};

  if (activeStatuses.has(subscription.status)) {
    orgUpdate.plan_code = planCode;
    if (founder) orgUpdate.founder = true;
  } else if (subscription.status === "canceled") {
    orgUpdate.plan_code = "free";
  }

  if (Object.keys(orgUpdate).length > 0) {
    const { error: orgErr } = await admin.from("organizations").update(orgUpdate).eq("id", orgId);
    if (orgErr) {
      captureException(orgErr, { step: "stripe_sync_org_update", orgId });
      throw orgErr;
    }
  }
}

export async function syncCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) return;

  const { getStripe } = await import("./server");
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionFromStripe(subscription);
}
