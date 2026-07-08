"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { sendPilotLoginEmailForUser } from "@/lib/pilot/sendPilotLoginEmail";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserRoleAction(formData: FormData) {
  const actor = await requireSuperAdminConsole();

  const userId = String(formData.get("userId") ?? "");
  const appRoleId = String(formData.get("appRoleId") ?? "");

  if (!userId || !appRoleId) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: ar, error: arErr } = await admin.from("app_roles").select("id, slug, permissions_base").eq("id", appRoleId).maybeSingle();

  if (arErr || !ar) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  if (actor.id === userId && ar.slug !== "super_admin") {
    redirect(consoleSectionUrl("users", { status: "self" }));
  }

  const { error } = await admin.from("users").update({ role: ar.permissions_base, app_role_id: ar.id }).eq("id", userId);

  if (error) {
    redirect(consoleSectionUrl("users", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("users", { status: "updated" }));
}

/** Update name, organization, and role together from the edit dialog. */
export async function updateUserDetailsAction(formData: FormData) {
  const actor = await requireSuperAdminConsole();

  const userId = String(formData.get("userId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const orgIdRaw = String(formData.get("orgId") ?? "").trim();
  const appRoleId = String(formData.get("appRoleId") ?? "").trim();

  if (!userId || !appRoleId) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  const admin = createAdminClient();

  const { data: ar, error: arErr } = await admin
    .from("app_roles")
    .select("id, slug, permissions_base")
    .eq("id", appRoleId)
    .maybeSingle();

  if (arErr || !ar) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  if (actor.id === userId && ar.slug !== "super_admin") {
    redirect(consoleSectionUrl("users", { status: "self" }));
  }

  const org_id = !orgIdRaw || orgIdRaw === "__unassigned__" ? null : orgIdRaw;
  const supportProviderRaw = String(formData.get("supportProviderId") ?? "").trim();
  const support_provider_id =
    !supportProviderRaw || supportProviderRaw === "__none__" ? null : supportProviderRaw;
  const isFounderRaw = String(formData.get("isFounder") ?? "").trim();

  if (ar.slug === "support_technician" && !support_provider_id) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  if (org_id) {
    const { data: org, error: orgErr } = await admin.from("organizations").select("id").eq("id", org_id).maybeSingle();
    if (orgErr || !org) {
      redirect(consoleSectionUrl("users", { status: "invalid" }));
    }
  }

  const { data: existingUser } = await admin
    .from("users")
    .select("is_founder, founder_enrolled_at")
    .eq("id", userId)
    .maybeSingle();

  const nextIsFounder = isFounderRaw === "yes";
  const founderPatch =
    nextIsFounder === Boolean(existingUser?.is_founder)
      ? {}
      : nextIsFounder
        ? {
            is_founder: true,
            founder_enrolled_at: existingUser?.founder_enrolled_at ?? new Date().toISOString(),
          }
        : { is_founder: false, founder_enrolled_at: null };

  const { error } = await admin
    .from("users")
    .update({
      full_name: fullName || null,
      org_id: ar.slug === "support_technician" ? null : org_id,
      role: ar.permissions_base,
      app_role_id: ar.id,
      support_provider_id: ar.slug === "support_technician" ? support_provider_id : null,
      ...founderPatch,
    })
    .eq("id", userId);

  if (error) {
    redirect(consoleSectionUrl("users", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("users", { status: "updated" }));
}

/** Delete only removes the public.users profile row; auth.users is preserved. */
export async function deleteUserAction(formData: FormData) {
  const actor = await requireSuperAdminConsole();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  if (actor.id === userId) {
    redirect(consoleSectionUrl("users", { status: "self" }));
  }

  const admin = createAdminClient();
  const { error } = await admin.from("users").delete().eq("id", userId);

  if (error) {
    redirect(consoleSectionUrl("users", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("users", { status: "deleted" }));
}

/** Reset password and email pilot-style login credentials to the user. */
export async function sendPilotLoginEmailAction(formData: FormData) {
  await requireSuperAdminConsole();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    redirect(consoleSectionUrl("users", { status: "invalid" }));
  }

  const result = await sendPilotLoginEmailForUser(userId);
  if (!result.ok) {
    if (result.code === "email_not_configured") {
      redirect(consoleSectionUrl("users", { status: "pilot-email-not-configured" }));
    }
    redirect(consoleSectionUrl("users", { status: "pilot-email-failed" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("users", { status: "pilot-email-sent" }));
}
