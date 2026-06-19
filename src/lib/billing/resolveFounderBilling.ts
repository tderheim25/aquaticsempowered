import "server-only";

import { founderDiscountEndsAt, isFounderDiscountActive } from "@/lib/founders/founderProgram";
import { formatSubscriptionDate } from "@/lib/billing/planCatalog";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingFounderContext = {
  isFounder: boolean;
  taggedFounder: boolean;
  founderEnrolledAt: string | null;
  founderDiscountEndsAt: string | null;
  founderDiscountEndsFormatted: string | null;
};

export async function resolveBillingFounderContext(
  billingRootId: string,
  orgFounder: boolean,
): Promise<BillingFounderContext> {
  const admin = createAdminClient();

  const { data: facilityOrgs } = await admin
    .from("organizations")
    .select("id")
    .eq("billing_org_id", billingRootId);

  const orgIds = Array.from(new Set([billingRootId, ...(facilityOrgs ?? []).map((o) => o.id)]));

  const { data: memberships } = await admin
    .from("organization_memberships")
    .select("user_id")
    .in("org_id", orgIds)
    .eq("is_owner", true);

  const userIds = Array.from(new Set((memberships ?? []).map((m) => m.user_id)));
  let founderEnrolledAt: string | null = null;
  let ownerIsFounder = false;

  if (userIds.length > 0) {
    const { data: owners } = await admin
      .from("users")
      .select("is_founder, founder_enrolled_at")
      .in("id", userIds);

    for (const owner of owners ?? []) {
      if (!owner.is_founder) continue;
      ownerIsFounder = true;
      if (!owner.founder_enrolled_at) continue;
      if (!founderEnrolledAt || owner.founder_enrolled_at < founderEnrolledAt) {
        founderEnrolledAt = owner.founder_enrolled_at;
      }
    }
  }

  const taggedFounder = orgFounder || ownerIsFounder;
  const isFounder = isFounderDiscountActive(founderEnrolledAt, taggedFounder);
  const discountEndsAt = founderEnrolledAt ? founderDiscountEndsAt(founderEnrolledAt).toISOString() : null;

  return {
    isFounder,
    taggedFounder,
    founderEnrolledAt,
    founderDiscountEndsAt: isFounder ? discountEndsAt : null,
    founderDiscountEndsFormatted: isFounder ? formatSubscriptionDate(discountEndsAt) : null,
  };
}
