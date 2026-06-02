import "server-only";

import {
  buildOrgSubscriptionSummary,
  type OrgSubscriptionSummary,
} from "@/lib/billing/subscriptionSummary";
import type { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function loadOrgSubscriptionSummary(
  supabase: ServerSupabase,
  orgId: string,
  orgPlanCode: PlanCode,
  canManageBilling: boolean,
): Promise<OrgSubscriptionSummary> {
  const [{ data: subscription }, { data: founderLead }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "plan_code, status, current_period_end, stripe_customer_id, stripe_subscription_id",
      )
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("request_type")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return buildOrgSubscriptionSummary({
    orgPlanCode,
    subscription,
    canManageBilling,
    founderLeadRequestType: founderLead?.request_type ?? null,
  });
}
