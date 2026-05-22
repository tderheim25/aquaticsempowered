"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SUPER_ADMIN_ORG_COOKIE, isUuid } from "@/lib/auth/activeOrgShared";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

function safeRedirectPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/app";
  return trimmed;
}

/** Super admin sidebar: switch which facility org to work in (GoHighLevel-style). */
export async function setSuperAdminOrgAction(formData: FormData) {
  const profile = await requireProfileForApp();
  if (profile.role !== "super_admin" || profile.org_id) {
    redirect("/app");
  }

  const orgId = String(formData.get("orgId") ?? "").trim();
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? "/app"));

  const store = await cookies();

  if (!orgId) {
    store.delete(SUPER_ADMIN_ORG_COOKIE);
    revalidatePath("/app", "layout");
    redirect(redirectTo);
  }

  if (!isUuid(orgId)) {
    redirect(`${redirectTo}?org_error=invalid`);
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("id", orgId).maybeSingle();
  if (!org) {
    redirect(`${redirectTo}?org_error=unknown`);
  }

  store.set(SUPER_ADMIN_ORG_COOKIE, orgId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });

  revalidatePath("/app", "layout");
  redirect(redirectTo);
}
