import "server-only";

import { syncOwnerAppRoleForOrg } from "@/lib/auth/planOwnerRoles";
import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";

export type PilotAccessStatus = {
  expired: boolean;
  pilotAccessUntil: string | null;
  orgName: string | null;
};

function isMissingPilotAccessColumn(error: { code?: string; message?: string } | null): boolean {
  if (error?.code !== "PGRST204") return false;
  return (error.message ?? "").toLowerCase().includes("pilot_access_until");
}

/**
 * If pilot_access_until has passed, downgrade billing root to free and cancel subscription.
 * Idempotent when already downgraded.
 */
export async function enforceExpiredPilotAccess(billingRootOrgId: string): Promise<PilotAccessStatus> {
  const admin = createAdminClient();
  const rootId = await resolveBillingRootOrgId(billingRootOrgId);

  const orgQuery = await admin
    .from("organizations")
    .select("id, name, plan_code, pilot_access_until")
    .eq("id", rootId)
    .maybeSingle();

  if (orgQuery.error && isMissingPilotAccessColumn(orgQuery.error)) {
    return { expired: false, pilotAccessUntil: null, orgName: null };
  }

  const org = orgQuery.data;
  if (!org?.pilot_access_until) {
    return { expired: false, pilotAccessUntil: null, orgName: org?.name ?? null };
  }

  const until = new Date(org.pilot_access_until);
  if (Number.isNaN(until.getTime()) || until.getTime() > Date.now()) {
    return {
      expired: false,
      pilotAccessUntil: org.pilot_access_until,
      orgName: org.name,
    };
  }

  if (org.plan_code === "free") {
    return {
      expired: true,
      pilotAccessUntil: org.pilot_access_until,
      orgName: org.name,
    };
  }

  const { error: orgErr } = await admin
    .from("organizations")
    .update({ plan_code: "free" })
    .eq("id", rootId);

  if (orgErr) {
    captureException(orgErr, { step: "pilot_access_downgrade_org", orgId: rootId });
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("org_id", rootId)
    .maybeSingle();

  if (sub?.id) {
    const { error: subErr } = await admin
      .from("subscriptions")
      .update({ status: "canceled", plan_code: "free" })
      .eq("id", sub.id);
    if (subErr) {
      captureException(subErr, { step: "pilot_access_downgrade_sub", orgId: rootId });
    }
  }

  try {
    await syncOwnerAppRoleForOrg(rootId);
  } catch (error) {
    captureException(error, { step: "pilot_access_sync_roles", orgId: rootId });
  }

  return {
    expired: true,
    pilotAccessUntil: org.pilot_access_until,
    orgName: org.name,
  };
}
