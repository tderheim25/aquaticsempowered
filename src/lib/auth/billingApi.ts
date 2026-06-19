import "server-only";

import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type BillingApiContext = {
  userId: string;
  email: string;
  orgId: string;
};

export type BillingApiAuthResult =
  | { ok: true; ctx: BillingApiContext }
  | { ok: false; status: number; error: string };

export async function requireBillingApiContext(): Promise<BillingApiAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const profile = await getUsersRowWithAdminFallback(user.id);
  if (!profile) {
    return { ok: false, status: 403, error: "Profile required" };
  }

  if (profile.role !== "org_admin" && profile.role !== "super_admin") {
    return { ok: false, status: 403, error: "Not authorized to manage billing" };
  }

  const orgCtx = await loadActiveOrgContext(profile);
  const orgId = orgCtx.billingRootOrgId ?? orgCtx.activeOrgId ?? profile.org_id;
  if (!orgId) {
    return { ok: false, status: 403, error: "Organization required" };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      email: user.email,
      orgId,
    },
  };
}
