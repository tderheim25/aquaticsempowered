import "server-only";

import { formatSubscriptionDate, validUntilLabel } from "@/lib/billing/planCatalog";
import { isBillingActive, normalizeSubscriptionStatus } from "@/lib/billing/subscriptionSummary";
import { FOUNDER_DISCOUNT_BADGE } from "@/lib/founders/founderProgram";
import {
  annualTotalUsd,
  ESSENTIAL_MONTHLY_USD,
  founderBaseMonthlyUsd,
  PRO_MONTHLY_USD,
} from "@/lib/marketing/publicPricing";
import { applyPromoDiscount } from "@/lib/marketing/sitePromo";
import { findBasePlanItem } from "@/lib/stripe/syncPoolSubscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import type { BillingCadence } from "@/lib/stripe/prices";
import type { PlanCode } from "@/types/database";
import type Stripe from "stripe";

export type OrgBillingSummary = {
  cadence: BillingCadence;
  isFounder: boolean;
  periodEnd: string | null;
  periodEndFormatted: string | null;
  renewalLine: string | null;
  founderMonthlyBaseUsd: number | null;
  periodPaidUsd: number | null;
  discountLabel: string | null;
  listMonthlyUsd: number | null;
  founderEnrolledAt: string | null;
  founderDiscountEndsAt: string | null;
  founderDiscountEndsFormatted: string | null;
};

function listMonthlyUsdForPlan(planCode: PlanCode): number | null {
  switch (planCode) {
    case "essential":
      return ESSENTIAL_MONTHLY_USD;
    case "pro":
      return PRO_MONTHLY_USD;
    default:
      return null;
  }
}

function cadenceFromStripeInterval(interval: string | undefined): BillingCadence {
  return interval === "year" ? "annual" : "monthly";
}

function periodFromSubscriptionItem(item: Stripe.SubscriptionItem | undefined): {
  start: string | null;
  end: string | null;
} {
  if (!item?.current_period_start || !item?.current_period_end) {
    return { start: null, end: null };
  }
  return {
    start: new Date(item.current_period_start * 1000).toISOString(),
    end: new Date(item.current_period_end * 1000).toISOString(),
  };
}

function estimatePeriodPaidUsd(
  planCode: PlanCode,
  cadence: BillingCadence,
  isFounder: boolean,
): number | null {
  const listMonthly = listMonthlyUsdForPlan(planCode);
  if (listMonthly == null) return null;

  if (cadence === "annual") {
    const annualList = annualTotalUsd(listMonthly);
    return isFounder ? applyPromoDiscount(annualList) : annualList;
  }

  const monthlyList = listMonthly;
  return isFounder ? founderBaseMonthlyUsd(monthlyList) : monthlyList;
}

async function resolvePeriodPaidUsdFromStripe(
  subscription: Stripe.Subscription,
  planCode: PlanCode,
  cadence: BillingCadence,
  isFounder: boolean,
): Promise<number | null> {
  const latestInvoice = subscription.latest_invoice;
  if (latestInvoice && typeof latestInvoice !== "string" && latestInvoice.status === "paid") {
    return Math.round(latestInvoice.amount_paid / 100);
  }

  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      status: "paid",
      limit: 1,
    });
    const paid = invoices.data[0];
    if (paid?.amount_paid) {
      return Math.round(paid.amount_paid / 100);
    }
  } catch {
    // Fall back to catalog estimate.
  }

  return estimatePeriodPaidUsd(planCode, cadence, isFounder);
}

export async function loadStripeBillingSummary(input: {
  planCode: PlanCode;
  status: string;
  isFounder: boolean;
  stripeSubscriptionId: string | null;
  billingCadence: BillingCadence | null;
  periodEnd: string | null;
  founderEnrolledAt?: string | null;
  founderDiscountEndsAt?: string | null;
  founderDiscountEndsFormatted?: string | null;
}): Promise<OrgBillingSummary | null> {
  if (!isBillingActive(normalizeSubscriptionStatus(input.status))) {
    return null;
  }

  const listMonthlyUsd = listMonthlyUsdForPlan(input.planCode);
  let cadence: BillingCadence = input.billingCadence ?? "monthly";
  let periodEnd = input.periodEnd;
  let periodPaidUsd: number | null = null;

  if (input.stripeSubscriptionId && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId, {
        expand: ["latest_invoice", "items.data.price"],
      });
      const baseItem = findBasePlanItem(subscription);
      const { end } = periodFromSubscriptionItem(baseItem);
      if (end) periodEnd = end;
      cadence = cadenceFromStripeInterval(baseItem?.price?.recurring?.interval);
      periodPaidUsd = await resolvePeriodPaidUsdFromStripe(
        subscription,
        input.planCode,
        cadence,
        input.isFounder,
      );
    } catch {
      periodPaidUsd = estimatePeriodPaidUsd(input.planCode, cadence, input.isFounder);
    }
  } else {
    periodPaidUsd = estimatePeriodPaidUsd(input.planCode, cadence, input.isFounder);
  }

  const periodEndFormatted = formatSubscriptionDate(periodEnd);
  const renewalLine = validUntilLabel(input.status, periodEnd);

  return {
    cadence,
    isFounder: input.isFounder,
    periodEnd,
    periodEndFormatted,
    renewalLine,
    founderMonthlyBaseUsd:
      input.isFounder && listMonthlyUsd != null ? founderBaseMonthlyUsd(listMonthlyUsd) : null,
    periodPaidUsd,
    discountLabel: input.isFounder ? FOUNDER_DISCOUNT_BADGE : null,
    listMonthlyUsd,
    founderEnrolledAt: input.isFounder ? (input.founderEnrolledAt ?? null) : null,
    founderDiscountEndsAt: input.isFounder ? (input.founderDiscountEndsAt ?? null) : null,
    founderDiscountEndsFormatted: input.isFounder
      ? (input.founderDiscountEndsFormatted ?? null)
      : null,
  };
}

export function canPurchasePoolAddons(input: {
  planCode: PlanCode;
  status: string;
  stripeSubscriptionId: string | null;
  poolAddonPriceConfigured: boolean;
}): { allowed: boolean; reason: string | null } {
  if (!input.poolAddonPriceConfigured) {
    return {
      allowed: false,
      reason:
        "Pool add-on billing is not configured. Add STRIPE_PRICE_POOL_ADDON_MONTHLY to enable purchases.",
    };
  }

  const normalized = normalizeSubscriptionStatus(input.status);
  if (!isBillingActive(normalized)) {
    return {
      allowed: false,
      reason: "An active subscription is required before purchasing pool add-ons.",
    };
  }

  if (input.planCode === "free") {
    return {
      allowed: false,
      reason: "Subscribe to a paid plan before purchasing pool add-ons.",
    };
  }

  if (!input.stripeSubscriptionId) {
    return {
      allowed: false,
      reason: "Billing is still syncing. Refresh the page and try again.",
    };
  }

  return { allowed: true, reason: null };
}
