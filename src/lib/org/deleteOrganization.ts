import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteOrganizationResult =
  | { ok: true; deletedOrgIds: string[] }
  | { ok: false; error: string };

/**
 * Deletes a facility org, or an entire billing account (root + child facilities).
 * Child facilities must be removed before the billing root because of billing_org_id FK restrict.
 */
export async function deleteOrganizationTree(orgId: string): Promise<DeleteOrganizationResult> {
  const admin = createAdminClient();

  const { data: org, error: loadErr } = await admin
    .from("organizations")
    .select("id, name, billing_org_id")
    .eq("id", orgId)
    .maybeSingle();

  if (loadErr || !org) {
    return { ok: false, error: loadErr?.message ?? "Organization not found." };
  }

  const billingRootId = org.billing_org_id ?? org.id;
  const isBillingRoot = org.id === billingRootId;
  const deletedOrgIds: string[] = [];

  if (isBillingRoot) {
    const { data: children, error: childrenErr } = await admin
      .from("organizations")
      .select("id")
      .eq("billing_org_id", billingRootId)
      .neq("id", billingRootId);

    if (childrenErr) {
      return { ok: false, error: childrenErr.message };
    }

    for (const child of children ?? []) {
      const { error } = await admin.from("organizations").delete().eq("id", child.id);
      if (error) return { ok: false, error: error.message };
      deletedOrgIds.push(child.id);
    }

    const { error: rootErr } = await admin.from("organizations").delete().eq("id", billingRootId);
    if (rootErr) return { ok: false, error: rootErr.message };
    deletedOrgIds.push(billingRootId);
  } else {
    const { error } = await admin.from("organizations").delete().eq("id", orgId);
    if (error) return { ok: false, error: error.message };
    deletedOrgIds.push(orgId);
  }

  return { ok: true, deletedOrgIds };
}

/** Counts child facilities under the same billing root (excludes the root). */
export async function countChildFacilities(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, billing_org_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return 0;
  const billingRootId = org.billing_org_id ?? org.id;
  if (org.id !== billingRootId) return 0;

  const { count } = await admin
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("billing_org_id", billingRootId)
    .neq("id", billingRootId);

  return count ?? 0;
}
