import "server-only";

import type { UsersRow } from "@/lib/auth/rbac";
import { homePathForRole } from "@/lib/auth/homePath";
import { loadOrgSubscriptionSummary } from "@/lib/billing/loadOrgSubscriptionSummary";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode, UserRole } from "@/types/database";

export type FounderProgramBlocked = {
  title: string;
  message: string;
  orgName: string | null;
  subscriptionLine: string | null;
  dashboardHref: string;
  billingHref: string | null;
};

export type FounderProgramGate =
  | { eligible: true }
  | ({ eligible: false } & FounderProgramBlocked);

function buildBlockedCopy(
  role: UserRole,
  orgName: string,
  isFounderOrg: boolean
): { title: string; message: string } {
  switch (role) {
    case "org_admin":
    case "super_admin":
      if (isFounderOrg) {
        return {
          title: "You're already a founder",
          message: `You're already subscribed as an Organization founder for ${orgName}. Your facility data and team are linked to this account — you don't need to register again.`,
        };
      }
      return {
        title: "You already have an organization",
        message: `You already administer ${orgName}. Use your dashboard to manage pools, team, and billing.`,
      };
    case "manager":
    case "staff":
      return {
        title: "You're already on a team",
        message: `You're already a member of ${orgName}. Ask your organization admin if you need access changes or billing updates.`,
      };
    case "vendor":
      return {
        title: "Vendor account",
        message:
          "Your account is registered as a vendor partner. The Founder Program is for facility operators — use your vendor portal instead.",
      };
    case "support_technician":
      return {
        title: "Support portal account",
        message:
          "Your account is set up for the support portal. The Founder Program is for facility operators.",
      };
    default:
      return {
        title: "Already registered",
        message: `You're already linked to ${orgName}. Go to your dashboard to continue.`,
      };
  }
}

/** User-facing error when the wizard is submitted despite an existing org link. */
export function founderProgramBlockedError(profile: Pick<UsersRow, "role" | "org_id">, orgName: string | null) {
  const name = orgName ?? "your organization";
  if (profile.role === "org_admin" || profile.role === "super_admin") {
    return `You're already linked to ${name}. Sign out and use a different email if you need a separate founder account.`;
  }
  if (profile.role === "manager" || profile.role === "staff") {
    return `You're already a member of ${name}.`;
  }
  return `Your account is already set up. Visit your dashboard instead of registering again.`;
}

/**
 * Whether the signed-in user may use the Founder Program wizard.
 * Users with `org_id` are blocked — re-running the wizard creates a new org and orphans facility data.
 */
export async function resolveFounderProgramGate(profile: UsersRow | null): Promise<FounderProgramGate> {
  if (!profile?.org_id) {
    return { eligible: true };
  }

  const supabase = await createClient();
  const orgId = profile.org_id;

  const [{ data: org }, { data: founderLead }] = await Promise.all([
    supabase.from("organizations").select("name, founder, plan_code").eq("id", orgId).maybeSingle(),
    supabase
      .from("leads")
      .select("request_type")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const orgName = org?.name ?? "your organization";
  const isFounderOrg = org?.founder === true || founderLead?.request_type === "founder_account";
  const { title, message } = buildBlockedCopy(profile.role, orgName, isFounderOrg);

  const canManageBilling = profile.role === "org_admin" || profile.role === "super_admin";
  let subscriptionLine: string | null = null;
  let billingHref: string | null = null;

  if (canManageBilling && org) {
    const summary = await loadOrgSubscriptionSummary(
      supabase,
      orgId,
      (org.plan_code as PlanCode) ?? "free",
      canManageBilling
    );
    if (summary.planCode !== "free" || (summary.status !== "free" && summary.status !== "inactive")) {
      subscriptionLine = `${summary.planLabel} · ${summary.statusLabel}`;
    }
    if (profile.role === "org_admin" || profile.role === "super_admin") {
      billingHref = "/app/billing";
    }
  }

  return {
    eligible: false,
    title,
    message,
    orgName: org?.name ?? null,
    subscriptionLine,
    dashboardHref: homePathForRole(profile.role),
    billingHref,
  };
}

/** Returns an error message if the signed-in user must not run the founder wizard. */
export async function getFounderWizardBlockReason(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("org_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.org_id) return null;

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", profile.org_id)
    .maybeSingle();

  return founderProgramBlockedError(profile, org?.name ?? null);
}
