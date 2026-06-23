"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  ACTIVE_ORG_COOKIE,
  SUPER_ADMIN_ORG_COOKIE,
  isUuid,
  loadUserOrgMemberships,
  userHasOrgMembership,
} from "@/lib/auth/activeOrg";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

function safeRedirectPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/app";
  return trimmed;
}

export type SetActiveOrgResult = {
  redirectTo: string;
  refreshSession: boolean;
};

/** Switch active facility org (multi-facility owners and super admins). */
export async function setActiveOrgAction(formData: FormData): Promise<SetActiveOrgResult> {
  const profile = await requireProfileForApp();
  const orgId = String(formData.get("orgId") ?? "").trim();
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? "/app"));

  const isSuperAdminPicker = profile.role === "super_admin" && !profile.org_id;

  if (!orgId) {
    if (!isSuperAdminPicker) {
      return { redirectTo, refreshSession: false };
    }

    const store = await cookies();
    store.delete(ACTIVE_ORG_COOKIE);
    store.delete(SUPER_ADMIN_ORG_COOKIE);
    revalidatePath("/app", "layout");
    return { redirectTo, refreshSession: false };
  }

  if (!isUuid(orgId)) {
    return { redirectTo: `${redirectTo}?org_error=invalid`, refreshSession: false };
  }

  if (!isSuperAdminPicker) {
    const hasMembership = await userHasOrgMembership(profile.id, orgId);
    if (!hasMembership && profile.org_id !== orgId) {
      return { redirectTo: `${redirectTo}?org_error=forbidden`, refreshSession: false };
    }
  } else {
    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("id").eq("id", orgId).maybeSingle();
    if (!org) {
      return { redirectTo: `${redirectTo}?org_error=unknown`, refreshSession: false };
    }
  }

  const store = await cookies();
  store.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });
  if (isSuperAdminPicker) {
    store.set(SUPER_ADMIN_ORG_COOKIE, orgId, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  const memberships = await loadUserOrgMemberships(profile.id);
  const refreshSession = !isSuperAdminPicker && memberships.length > 0;

  if (refreshSession) {
    const admin = createAdminClient();
    await admin.from("user_preferences").upsert({
      user_id: profile.id,
      active_org_id: orgId,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/app", "layout");
  return { redirectTo, refreshSession };
}

/** @deprecated Use setActiveOrgAction */
export async function setSuperAdminOrgAction(formData: FormData) {
  const result = await setActiveOrgAction(formData);
  const { redirect } = await import("next/navigation");
  redirect(result.redirectTo);
}
