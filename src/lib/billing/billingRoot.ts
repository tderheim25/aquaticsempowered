import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Subscription and pool add-on billing root for a facility org. */
export async function resolveBillingRootOrgId(orgId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("billing_org_id")
    .eq("id", orgId)
    .maybeSingle();
  return data?.billing_org_id ?? orgId;
}

/** Active pools across every facility under the same billing account. */
export async function countActivePoolsForBillingRoot(billingRootId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("billing_org_id", billingRootId);

  const orgIds = (orgs ?? []).map((row) => row.id);
  if (orgIds.length === 0) return 0;

  const { count } = await admin
    .from("pools")
    .select("id", { count: "exact", head: true })
    .in("org_id", orgIds)
    .eq("status", "active");

  return count ?? 0;
}
