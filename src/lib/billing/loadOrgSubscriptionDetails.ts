import "server-only";

import { countActivePoolsForBillingRoot, resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { getMonthlyTotal } from "@/lib/billing/poolBilling";
import {
  canPurchasePoolAddons,
  loadStripeBillingSummary,
  type OrgBillingSummary,
} from "@/lib/billing/loadStripeBillingSummary";
import { loadOrgSubscriptionSummary } from "@/lib/billing/loadOrgSubscriptionSummary";
import { resolveBillingFounderContext } from "@/lib/billing/resolveFounderBilling";
import { formatSubscriptionDate, validUntilLabel } from "@/lib/billing/planCatalog";
import { isBillingActive, normalizeSubscriptionStatus } from "@/lib/billing/subscriptionSummary";
import { getStripePoolAddonPriceId } from "@/lib/stripe/prices";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingCadence } from "@/lib/stripe/prices";
import type { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type OrgPoolBillingBreakdown = {
  activePoolCount: number;
  addonQuantity: number;
  baseUsd: number;
  poolFeesUsd: number;
  totalUsd: number;
  founder: boolean;
};

export type OrgSubscriptionDetails = {
  summary: Awaited<ReturnType<typeof loadOrgSubscriptionSummary>>;
  orgName: string | null;
  isFounder: boolean;
  founderDiscountEndsFormatted: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  periodStartFormatted: string | null;
  periodEndFormatted: string | null;
  validUntilLine: string | null;
  hasStripeSubscription: boolean;
  canChangePlan: boolean;
  canPurchasePoolAddons: boolean;
  poolAddonPurchaseBlockedReason: string | null;
  poolBilling: OrgPoolBillingBreakdown | null;
  billingSummary: OrgBillingSummary | null;
};

export async function loadOrgSubscriptionDetails(
  supabase: ServerSupabase,
  orgId: string,
  orgPlanCode: PlanCode,
  orgName: string | null,
  canManageBilling: boolean,
): Promise<OrgSubscriptionDetails> {
  const admin = createAdminClient();
  const billingRootId = await resolveBillingRootOrgId(orgId);

  const [{ data: subscription }, { data: rootOrg }, activePoolCount, summary] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "plan_code, status, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id",
      )
      .eq("org_id", billingRootId)
      .maybeSingle(),
    admin.from("organizations").select("plan_code, founder").eq("id", billingRootId).maybeSingle(),
    countActivePoolsForBillingRoot(billingRootId),
    loadOrgSubscriptionSummary(supabase, billingRootId, orgPlanCode, canManageBilling),
  ]);

  const planCode = (subscription?.plan_code as PlanCode) ?? (rootOrg?.plan_code as PlanCode) ?? orgPlanCode;
  const founderContext = await resolveBillingFounderContext(billingRootId, rootOrg?.founder ?? false);
  const founder = founderContext.isFounder;

  const poolBilling =
    planCode !== "free"
      ? getMonthlyTotal({
          planCode,
          founder,
          activePoolCount,
        })
      : null;

  const status = normalizeSubscriptionStatus(subscription?.status ?? "inactive");
  const activeStripe = isBillingActive(status);
  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id);

  const billingSummary = await loadStripeBillingSummary({
    planCode,
    status,
    isFounder: founder,
    stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    billingCadence: null,
    periodEnd: subscription?.current_period_end ?? null,
    founderEnrolledAt: founderContext.founderEnrolledAt,
    founderDiscountEndsAt: founderContext.founderDiscountEndsAt,
    founderDiscountEndsFormatted: founderContext.founderDiscountEndsFormatted,
  });

  const periodEnd = billingSummary?.periodEnd ?? subscription?.current_period_end ?? null;
  const periodEndFormatted =
    billingSummary?.periodEndFormatted ?? formatSubscriptionDate(subscription?.current_period_end ?? null);
  const validUntilLine =
    billingSummary?.renewalLine ?? validUntilLabel(status, periodEnd);

  const poolAddonEligibility = canPurchasePoolAddons({
    planCode,
    status,
    stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    poolAddonPriceConfigured: Boolean(getStripePoolAddonPriceId()),
  });

  return {
    summary,
    orgName,
    isFounder: founder,
    founderDiscountEndsFormatted: founderContext.founderDiscountEndsFormatted,
    periodStart: subscription?.current_period_start ?? null,
    periodEnd,
    periodStartFormatted: formatSubscriptionDate(subscription?.current_period_start ?? null),
    periodEndFormatted,
    validUntilLine,
    hasStripeSubscription,
    canChangePlan: canManageBilling && hasStripeSubscription && activeStripe,
    canPurchasePoolAddons: poolAddonEligibility.allowed,
    poolAddonPurchaseBlockedReason: poolAddonEligibility.reason,
    poolBilling: poolBilling
      ? {
          activePoolCount,
          addonQuantity: poolBilling.addonQuantity,
          baseUsd: poolBilling.baseUsd,
          poolFeesUsd: poolBilling.poolFeesUsd,
          totalUsd: poolBilling.totalUsd,
          founder,
        }
      : null,
    billingSummary,
  };
}
