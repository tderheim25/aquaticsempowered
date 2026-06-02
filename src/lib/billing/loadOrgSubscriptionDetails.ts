import "server-only";

import { loadOrgSubscriptionSummary } from "@/lib/billing/loadOrgSubscriptionSummary";
import {
  formatSubscriptionDate,
  validUntilLabel,
} from "@/lib/billing/planCatalog";
import { normalizeSubscriptionStatus } from "@/lib/billing/subscriptionSummary";
import type { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type OrgSubscriptionDetails = {
  summary: Awaited<ReturnType<typeof loadOrgSubscriptionSummary>>;
  orgName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  periodStartFormatted: string | null;
  periodEndFormatted: string | null;
  validUntilLine: string | null;
  hasStripeSubscription: boolean;
  canChangePlan: boolean;
};

export async function loadOrgSubscriptionDetails(
  supabase: ServerSupabase,
  orgId: string,
  orgPlanCode: PlanCode,
  orgName: string | null,
  canManageBilling: boolean,
): Promise<OrgSubscriptionDetails> {
  const [{ data: subscription }, summary] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "plan_code, status, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id",
      )
      .eq("org_id", orgId)
      .maybeSingle(),
    loadOrgSubscriptionSummary(supabase, orgId, orgPlanCode, canManageBilling),
  ]);

  const status = normalizeSubscriptionStatus(subscription?.status ?? "inactive");
  const activeStripe = status === "active" || status === "trialing";
  const hasStripeSubscription = Boolean(subscription?.stripe_subscription_id);

  return {
    summary,
    orgName,
    periodStart: subscription?.current_period_start ?? null,
    periodEnd: subscription?.current_period_end ?? null,
    periodStartFormatted: formatSubscriptionDate(subscription?.current_period_start ?? null),
    periodEndFormatted: formatSubscriptionDate(subscription?.current_period_end ?? null),
    validUntilLine: validUntilLabel(status, subscription?.current_period_end ?? null),
    hasStripeSubscription,
    canChangePlan: canManageBilling && hasStripeSubscription && activeStripe,
  };
}
