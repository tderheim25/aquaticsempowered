"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateUserRoleAction(formData: FormData) {
  await requireViewAccess("admin_portal");
  const actor = await requireRole("super_admin");

  const userId = String(formData.get("userId") ?? "");
  const appRoleId = String(formData.get("appRoleId") ?? "");

  if (!userId || !appRoleId) {
    redirect("/app/admin?section=users&status=invalid");
  }

  const admin = createAdminClient();
  const { data: ar, error: arErr } = await admin.from("app_roles").select("id, slug, permissions_base").eq("id", appRoleId).maybeSingle();

  if (arErr || !ar) {
    redirect("/app/admin?section=users&status=invalid");
  }

  if (actor.id === userId && ar.slug !== "super_admin") {
    redirect("/app/admin?section=users&status=self");
  }

  const { error } = await admin
    .from("users")
    .update({ role: ar.permissions_base, app_role_id: ar.id })
    .eq("id", userId);

  if (error) {
    redirect("/app/admin?section=users&status=error");
  }

  revalidatePath("/app");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/users");
  redirect("/app/admin?section=users&status=updated");
}
