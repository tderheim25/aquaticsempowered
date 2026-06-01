import { requireProfileForApp } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database";

/** Built-in enum roles (JWT / RLS). Custom roles use `app_roles` + `permissions_base`. */
export const ALL_ROLES: UserRole[] = [
  "super_admin",
  "org_admin",
  "manager",
  "staff",
  "vendor",
  "support_technician",
];

export const VIEW_DEFINITIONS = [
  { key: "dashboard_home", label: "Dashboard" },
  { key: "pools", label: "Pools" },
  { key: "chemical_logs", label: "Chemical Logs" },
  { key: "maintenance", label: "Maintenance" },
  { key: "support_center", label: "Support Center" },
  { key: "support_portal", label: "Support Portal" },
  { key: "vendor_directory", label: "Vendor Directory" },
  { key: "vendor_portal", label: "Vendor Portal" },
  { key: "community", label: "Community" },
  { key: "procurement", label: "Procurement" },
  { key: "training_cpo", label: "Training / CPO" },
  { key: "monitoring", label: "Monitoring" },
  { key: "energy_audits", label: "Energy Audits" },
  { key: "admin_portal", label: "Admin Portal" },
] as const;

export type AppViewKey = (typeof VIEW_DEFINITIONS)[number]["key"];

export const ALL_VIEW_KEYS: AppViewKey[] = VIEW_DEFINITIONS.map((view) => view.key);

export type ProfileForViews = {
  role: UserRole;
  app_role_id: string | null;
};

const DEFAULT_ROLE_VIEWS: Record<UserRole, AppViewKey[]> = {
  super_admin: ALL_VIEW_KEYS,
  org_admin: [
    "dashboard_home",
    "pools",
    "chemical_logs",
    "maintenance",
    "support_center",
    "vendor_directory",
    "community",
    "procurement",
    "training_cpo",
    "monitoring",
  ],
  manager: [
    "dashboard_home",
    "pools",
    "chemical_logs",
    "maintenance",
    "support_center",
    "vendor_directory",
    "procurement",
    "community",
    "training_cpo",
    "energy_audits",
  ],
  staff: [
    "dashboard_home",
    "pools",
    "chemical_logs",
    "maintenance",
    "support_center",
    "vendor_directory",
    "procurement",
    "training_cpo",
    "energy_audits",
  ],
  vendor: ["vendor_portal", "support_center"],
  support_technician: ["support_portal"],
};

export function getDefaultAllowedViews(role: UserRole | null): AppViewKey[] {
  if (!role) return ["dashboard_home"];
  return DEFAULT_ROLE_VIEWS[role] ?? ["dashboard_home"];
}

/** Resolve `app_roles.id` for permission rows (falls back to built-in slug match). */
export async function resolveAppRoleId(profile: ProfileForViews | null): Promise<string | null> {
  if (!profile) return null;
  if (profile.app_role_id) return profile.app_role_id;

  const supabase = await createClient();
  const { data } = await supabase.from("app_roles").select("id").eq("slug", profile.role).maybeSingle();
  return data?.id ?? null;
}

/**
 * Allowed dashboard views for the current user. Uses `app_role_view_permissions` when available;
 * falls back to defaults if tables are empty or missing (before migration).
 */
export async function getAllowedViewsForProfile(profile: ProfileForViews | null): Promise<AppViewKey[]> {
  if (!profile) return ["dashboard_home"];
  if (profile.role === "super_admin") return ALL_VIEW_KEYS;

  const roleId = await resolveAppRoleId(profile);
  if (!roleId) return getDefaultAllowedViews(profile.role);

  const supabase = await createClient();
  const { data, error } = await supabase.from("app_role_view_permissions").select("view_key, can_view").eq("role_id", roleId);

  if (error || !data?.length) {
    return getDefaultAllowedViews(profile.role);
  }

  const allowed = data
    .filter((row) => row.can_view)
    .map((row) => row.view_key)
    .filter((key): key is AppViewKey => ALL_VIEW_KEYS.includes(key as AppViewKey));

  if (allowed.length > 0) return allowed;
  return getDefaultAllowedViews(profile.role);
}

/** @deprecated Use getAllowedViewsForProfile — kept for compatibility */
export async function getAllowedViewsForRole(role: UserRole | null): Promise<AppViewKey[]> {
  return getAllowedViewsForProfile(role ? { role, app_role_id: null } : null);
}

export async function requireViewAccess(viewKey: AppViewKey) {
  const profile = await requireProfileForApp();

  const viewsProfile: ProfileForViews = {
    role: profile.role,
    app_role_id: profile.app_role_id,
  };

  if (viewsProfile.role === "super_admin") {
    return profile;
  }

  const allowedViews = await getAllowedViewsForProfile(viewsProfile);
  if (!allowedViews.includes(viewKey)) {
    redirect(`/app/forbidden?view=${encodeURIComponent(viewKey)}`);
  }

  return profile;
}
