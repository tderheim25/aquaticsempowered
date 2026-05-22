import { notFound } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";

import {
  SUPER_ADMIN_PORTAL_PATH,
  consoleSectionUrl,
  getSuperAdminPortalPath,
} from "@/lib/auth/superAdminPortalConstants";

export { SUPER_ADMIN_PORTAL_PATH, getSuperAdminPortalPath, consoleSectionUrl };

/**
 * AE Console is exclusive to `super_admin`. Other roles receive 404 (not forbidden).
 */
export async function requireSuperAdminConsole() {
  const profile = await requireProfileForApp();
  if (profile.role !== "super_admin") {
    notFound();
  }
  await requireViewAccess("admin_portal");
  return profile;
}

export function revalidateSuperAdminConsole() {
  return [getSuperAdminPortalPath(), "/app"];
}
