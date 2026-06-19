import type { UserRole } from "@/types/database";

import { isPlanOwnerAppRoleSlug } from "@/lib/auth/planOwnerRoleSlugs";

const JWT_ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Owner",
  manager: "Manager",
  staff: "Staff",
  vendor: "Vendor",
  support_technician: "Support Technician",
};

export type RoleDisplayInput = {
  role: UserRole | string;
  appRoleLabel?: string | null;
  appRoleSlug?: string | null;
};

/** Prefer `app_roles.label`; fall back to JWT enum label. */
export function getRoleDisplayLabel(input: RoleDisplayInput): string {
  if (input.appRoleLabel?.trim()) return input.appRoleLabel.trim();
  if (input.appRoleSlug && input.appRoleSlug !== "org_admin_legacy") {
    return input.appRoleSlug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return JWT_ROLE_LABELS[input.role] ?? String(input.role).replace(/_/g, " ");
}

export function roleDisplayTone(
  role: string,
  appRoleSlug?: string | null,
): "success" | "info" | "warning" | "neutral" | "primary" {
  if (role === "super_admin") return "primary";
  if (appRoleSlug && isPlanOwnerAppRoleSlug(appRoleSlug)) return "info";
  if (role === "org_admin") return "info";
  if (role === "manager") return "warning";
  if (role === "vendor") return "success";
  if (role === "support_technician") return "info";
  return "neutral";
}

export function isOrganizationOwner(input: { role: string; appRoleSlug?: string | null }): boolean {
  if (input.role === "org_admin") return true;
  return Boolean(input.appRoleSlug && isPlanOwnerAppRoleSlug(input.appRoleSlug));
}
