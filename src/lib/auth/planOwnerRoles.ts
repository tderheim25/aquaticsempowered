import "server-only";

import {
  ownerAppRoleSlugForPlan,
  type PlanOwnerAppRoleSlug,
} from "@/lib/auth/planOwnerRoleSlugs";
import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";

export type { PlanOwnerAppRoleSlug } from "@/lib/auth/planOwnerRoleSlugs";
export {
  isPaidPlan,
  ownerAppRoleSlugForPlan,
  isPlanOwnerAppRoleSlug,
} from "@/lib/auth/planOwnerRoleSlugs";

export async function resolveAppRoleIdBySlug(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_roles").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/**
 * Updates plan-branded `app_role_id` for every billing-root owner.
 * Keeps `users.role = org_admin` for JWT / RLS.
 */
export async function syncOwnerAppRoleForOrg(orgId: string): Promise<void> {
  const admin = createAdminClient();
  const billingRootId = await resolveBillingRootOrgId(orgId);

  const { data: rootOrg, error: rootErr } = await admin
    .from("organizations")
    .select("plan_code")
    .eq("id", billingRootId)
    .maybeSingle();

  if (rootErr || !rootOrg) {
    captureException(rootErr ?? new Error("billing root org missing"), {
      step: "sync_owner_app_role_root",
      orgId: billingRootId,
    });
    return;
  }

  const ownerSlug = ownerAppRoleSlugForPlan(rootOrg.plan_code);
  const ownerRoleId = await resolveAppRoleIdBySlug(ownerSlug);
  if (!ownerRoleId) {
    captureException(new Error(`Owner app role missing: ${ownerSlug}`), {
      step: "sync_owner_app_role_slug",
      orgId: billingRootId,
    });
    return;
  }

  const { data: facilityOrgs } = await admin
    .from("organizations")
    .select("id")
    .eq("billing_org_id", billingRootId);

  const orgIds = Array.from(new Set([billingRootId, ...(facilityOrgs ?? []).map((o) => o.id)]));

  const { data: memberships, error: memErr } = await admin
    .from("organization_memberships")
    .select("user_id")
    .in("org_id", orgIds)
    .eq("is_owner", true);

  if (memErr) {
    captureException(memErr, { step: "sync_owner_app_role_memberships", orgId: billingRootId });
    return;
  }

  const userIds = Array.from(new Set((memberships ?? []).map((m) => m.user_id)));
  if (userIds.length === 0) return;

  const { error: updateErr } = await admin
    .from("users")
    .update({ role: "org_admin", app_role_id: ownerRoleId })
    .in("id", userIds);

  if (updateErr) {
    captureException(updateErr, { step: "sync_owner_app_role_users", orgId: billingRootId });
  }
}

/** Marks billing-root owners as founder (paid plans and founder program). */
export async function tagFounderOwnersForOrg(orgId: string): Promise<void> {
  const admin = createAdminClient();
  const billingRootId = await resolveBillingRootOrgId(orgId);
  const enrolledAt = new Date().toISOString();

  const { data: facilityOrgs } = await admin
    .from("organizations")
    .select("id")
    .eq("billing_org_id", billingRootId);

  const orgIds = Array.from(new Set([billingRootId, ...(facilityOrgs ?? []).map((o) => o.id)]));

  const { data: memberships, error: memErr } = await admin
    .from("organization_memberships")
    .select("user_id")
    .in("org_id", orgIds)
    .eq("is_owner", true);

  if (memErr) {
    captureException(memErr, { step: "tag_founder_owners_memberships", orgId: billingRootId });
    return;
  }

  const userIds = Array.from(new Set((memberships ?? []).map((m) => m.user_id)));
  if (userIds.length === 0) return;

  const { error: updateErr } = await admin
    .from("users")
    .update({ is_founder: true, founder_enrolled_at: enrolledAt })
    .in("id", userIds)
    .eq("is_founder", false);

  if (updateErr) {
    captureException(updateErr, { step: "tag_founder_owners_users", orgId: billingRootId });
  }
}
