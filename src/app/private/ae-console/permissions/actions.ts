"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { ALL_VIEW_KEYS } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

function slugifyLabel(label: string) {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return base || "role";
}

export async function updateRoleViewPermissionsAction(formData: FormData) {
  await requireSuperAdminConsole();

  const roleId = String(formData.get("roleId") ?? "");
  const selectedViews = new Set(formData.getAll("views").map((value) => String(value)));

  if (!roleId) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: roleRow, error: roleErr } = await admin.from("app_roles").select("id, slug").eq("id", roleId).maybeSingle();

  if (roleErr || !roleRow) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  if (roleRow.slug === "super_admin") {
    selectedViews.add("admin_portal");
    selectedViews.add("dashboard_home");
  }

  const payload = ALL_VIEW_KEYS.map((viewKey) => ({
    role_id: roleId,
    view_key: viewKey,
    can_view: selectedViews.has(viewKey),
  }));

  const { error } = await admin.from("app_role_view_permissions").upsert(payload, { onConflict: "role_id,view_key" });

  if (error) {
    redirect(consoleSectionUrl("permissions", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("permissions", { status: "updated", roleId }));
}

const VALID_BASE: UserRole[] = ["super_admin", "org_admin", "manager", "staff", "vendor"];

export async function createAppRoleAction(formData: FormData) {
  await requireSuperAdminConsole();

  const label = String(formData.get("label") ?? "").trim();
  const permissionsBase = String(formData.get("permissionsBase") ?? "") as UserRole;

  if (!label || !VALID_BASE.includes(permissionsBase)) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  const admin = createAdminClient();

  let slug = slugifyLabel(label);
  const { data: existingSlug } = await admin.from("app_roles").select("id").eq("slug", slug).maybeSingle();
  if (existingSlug) {
    slug = `${slug}_${Math.random().toString(36).slice(2, 8)}`;
  }

  const { data: inserted, error: insertErr } = await admin
    .from("app_roles")
    .insert({
      slug,
      label,
      permissions_base: permissionsBase,
      is_builtin: false,
      sort_order: 100,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    redirect(consoleSectionUrl("permissions", { status: "error" }));
  }

  const { data: baseRole } = await admin.from("app_roles").select("id").eq("slug", permissionsBase).maybeSingle();

  if (baseRole?.id) {
    const { data: copyRows } = await admin.from("app_role_view_permissions").select("view_key, can_view").eq("role_id", baseRole.id);

    if (copyRows && copyRows.length > 0) {
      await admin.from("app_role_view_permissions").insert(
        copyRows.map((row) => ({
          role_id: inserted.id,
          view_key: row.view_key,
          can_view: row.can_view,
        }))
      );
    } else {
      await admin.from("app_role_view_permissions").insert(
        ALL_VIEW_KEYS.map((viewKey) => ({
          role_id: inserted.id,
          view_key: viewKey,
          can_view: viewKey === "dashboard_home",
        }))
      );
    }
  } else {
    await admin.from("app_role_view_permissions").insert(
      ALL_VIEW_KEYS.map((viewKey) => ({
        role_id: inserted.id,
        view_key: viewKey,
        can_view: viewKey === "dashboard_home",
      }))
    );
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("permissions", { status: "role_created", label }));
}

export async function updateAppRoleAction(formData: FormData) {
  await requireSuperAdminConsole();

  const roleId = String(formData.get("roleId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const permissionsBase = String(formData.get("permissionsBase") ?? "") as UserRole;

  if (!roleId || !label || !VALID_BASE.includes(permissionsBase)) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: existing, error: existingErr } = await admin.from("app_roles").select("id, is_builtin").eq("id", roleId).maybeSingle();

  if (existingErr || !existing) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  if (existing.is_builtin) {
    redirect(consoleSectionUrl("permissions", { status: "builtin_locked" }));
  }

  const { error } = await admin.from("app_roles").update({ label, permissions_base: permissionsBase }).eq("id", roleId);

  if (error) {
    redirect(consoleSectionUrl("permissions", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("permissions", { status: "role_updated" }));
}

export async function deleteAppRoleAction(formData: FormData) {
  await requireSuperAdminConsole();

  const roleId = String(formData.get("roleId") ?? "");
  if (!roleId) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: roleRow, error: roleErr } = await admin.from("app_roles").select("id, slug, is_builtin").eq("id", roleId).maybeSingle();

  if (roleErr || !roleRow) {
    redirect(consoleSectionUrl("permissions", { status: "invalid" }));
  }

  if (roleRow.is_builtin || roleRow.slug === "super_admin") {
    redirect(consoleSectionUrl("permissions", { status: "builtin_locked" }));
  }

  const { count: assignedUsers, error: countErr } = await admin
    .from("users")
    .select("id", { head: true, count: "exact" })
    .eq("app_role_id", roleId);

  if (countErr) {
    redirect(consoleSectionUrl("permissions", { status: "error" }));
  }

  if ((assignedUsers ?? 0) > 0) {
    redirect(consoleSectionUrl("permissions", { status: "role_in_use" }));
  }

  const { error: deleteErr } = await admin.from("app_roles").delete().eq("id", roleId);

  if (deleteErr) {
    redirect(consoleSectionUrl("permissions", { status: "error" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  redirect(consoleSectionUrl("permissions", { status: "role_deleted" }));
}
