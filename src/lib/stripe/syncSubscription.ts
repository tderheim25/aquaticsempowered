import type Stripe from "stripe";

import { isPaidPlan, syncOwnerAppRoleForOrg, tagFounderOwnersForOrg } from "@/lib/auth/planOwnerRoles";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { PlanCode } from "@/types/database";

import { isFounderPriceId, parsePlanCode, planCodeFromStripePriceId, type BillingCadence } from "./prices";
import { findBasePlanItem, findPoolAddonItem } from "./syncPoolSubscription";
import { syncPoolLicenseQuantityFromStripe } from "@/lib/billing/poolLicenses";

type SubscriptionSyncRow = {
  org_id: string;
  plan_code: PlanCode;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  billing_cadence: BillingCadence | null;
  pool_license_quantity: number;
};

function isMissingOptionalSubscriptionColumn(
  error: { code?: string; message?: string } | null,
  column: string,
): boolean {
  if (error?.code !== "PGRST204") return false;
  return (error.message ?? "").toLowerCase().includes(column.toLowerCase());
}

function rowWithoutOptionalColumns(
  row: SubscriptionSyncRow,
  omitColumns: Array<keyof SubscriptionSyncRow>,
) {
  const next = { ...row };
  for (const key of omitColumns) {
    delete next[key];
  }
  return next;
}

async function upsertSubscriptionRow(
  admin: ReturnType<typeof createAdminClient>,
  existingId: string | undefined,
  row: SubscriptionSyncRow,
) {
  const attemptUpdate = async (payload: Record<string, unknown>) => {
    if (existingId) {
      return admin.from("subscriptions").update(payload).eq("id", existingId);
    }
    return admin.from("subscriptions").insert(payload);
  };

  let { error } = await attemptUpdate(row);
  if (
    error &&
    (isMissingOptionalSubscriptionColumn(error, "pool_license_quantity") ||
      isMissingOptionalSubscriptionColumn(error, "billing_cadence"))
  ) {
    ({ error } = await attemptUpdate(
      rowWithoutOptionalColumns(row, ["pool_license_quantity", "billing_cadence"]),
    ));
  }

  return error;
}

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function cadenceFromStripeInterval(interval: string | undefined): BillingCadence {
  return interval === "year" ? "annual" : "monthly";
}

function subscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
  cadence: BillingCadence;
} {
  const baseItem = findBasePlanItem(subscription);
  if (baseItem?.current_period_start && baseItem?.current_period_end) {
    return {
      start: new Date(baseItem.current_period_start * 1000).toISOString(),
      end: new Date(baseItem.current_period_end * 1000).toISOString(),
      cadence: cadenceFromStripeInterval(baseItem.price?.recurring?.interval),
    };
  }

  const raw = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const firstItem = subscription.items.data[0];
  return {
    start: raw.current_period_start
      ? new Date(raw.current_period_start * 1000).toISOString()
      : firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000).toISOString()
        : null,
    end: raw.current_period_end
      ? new Date(raw.current_period_end * 1000).toISOString()
      : firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
    cadence: cadenceFromStripeInterval(
      baseItem?.price?.recurring?.interval ?? firstItem?.price?.recurring?.interval,
    ),
  };
}

function basePlanPriceId(subscription: Stripe.Subscription): string | null {
  const baseItem = findBasePlanItem(subscription);
  return baseItem?.price?.id ?? subscription.items.data[0]?.price?.id ?? null;
}

function resolvePlanCode(subscription: Stripe.Subscription): PlanCode | null {
  const fromMetadata = parsePlanCode(subscription.metadata?.plan_code);
  if (fromMetadata) return fromMetadata;
  return planCodeFromStripePriceId(basePlanPriceId(subscription));
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
  const priceId = basePlanPriceId(subscription);
  const founder =
    isFounderPriceId(priceId) ||
    subscription.metadata?.flow === "founder" ||
    isPaidPlan(planCode);

  const admin = createAdminClient();

  const { start: periodStart, end: periodEnd, cadence } = subscriptionPeriod(subscription);

  const row: SubscriptionSyncRow = {
    org_id: orgId,
    plan_code: planCode,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    billing_cadence: cadence,
    pool_license_quantity: findPoolAddonItem(subscription)?.quantity ?? 0,
  };

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  const error = await upsertSubscriptionRow(admin, existing?.id, row);
  if (error) {
    captureException(error, {
      step: existing?.id ? "stripe_sync_subscription_update" : "stripe_sync_subscription_insert",
      orgId,
      message: error.message,
      code: error.code,
    });
    throw error;
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

  if (activeStatuses.has(subscription.status)) {
    await syncPoolLicenseQuantityFromStripe(orgId, subscription);
    if (orgUpdate.plan_code) {
      await syncOwnerAppRoleForOrg(orgId);
    }
    if (orgUpdate.founder) {
      await tagFounderOwnersForOrg(orgId);
    }
  }
}

/** Reconcile Supabase billing rows from Stripe when checkout completed but webhooks lag. */
export async function syncOrgBillingFromStripe(orgId: string): Promise<boolean> {
  const { getStripe, isStripeConfigured } = await import("./server");
  if (!isStripeConfigured()) return false;

  const admin = createAdminClient();
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!subRow?.stripe_customer_id && !subRow?.stripe_subscription_id) {
    return false;
  }

  const stripe = getStripe();

  if (subRow.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id, {
        expand: ["discounts"],
      });
      await syncSubscriptionFromStripe(subscription);
      return true;
    } catch (error) {
      captureException(error, { step: "stripe_sync_org_by_subscription_id", orgId });
    }
  }

  if (subRow.stripe_customer_id) {
    try {
      const listed = await stripe.subscriptions.list({
        customer: subRow.stripe_customer_id,
        limit: 10,
        status: "all",
      });
      const subscription =
        listed.data.find((entry) => entry.status === "active" || entry.status === "trialing") ??
        listed.data.find((entry) => entry.status !== "canceled") ??
        listed.data[0];

      if (subscription) {
        const expanded = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ["discounts"],
        });
        await syncSubscriptionFromStripe(expanded);
        return true;
      }
    } catch (error) {
      captureException(error, { step: "stripe_sync_org_by_customer", orgId });
    }
  }

  return false;
}

export async function syncCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) return;

  const { getStripe } = await import("./server");
  const { incrementFounderPromoRedemption } = await import("@/lib/marketing/sitePromo");
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discounts"],
  });
  await syncSubscriptionFromStripe(subscription);

  for (const entry of subscription.discounts ?? []) {
    if (typeof entry === "string") continue;
    const promoRef = entry.promotion_code;
    const promoId = typeof promoRef === "string" ? promoRef : promoRef?.id;
    if (promoId) {
      await incrementFounderPromoRedemption(promoId);
    }
  }
}
