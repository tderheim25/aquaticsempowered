import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/types/database";

export type UsersRow = Database["public"]["Tables"]["users"]["Row"];

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

/** Exported for admin list queries when `0005_app_roles.sql` is not applied yet. */
export function isMissingAppRoleIdColumnError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return m.includes("app_role_id") || (m.includes("schema cache") && m.includes("users"));
}

function isMissingSupportProviderColumnError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return m.includes("support_provider_id");
}

function isMissingProfileColumnError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("first_name") ||
    m.includes("last_name") ||
    m.includes("avatar_path") ||
    m.includes("vendor_id") ||
    (m.includes("schema cache") && m.includes("users"))
  );
}

const USERS_SELECT_FULL =
  "id, org_id, vendor_id, role, app_role_id, support_provider_id, email, full_name, first_name, last_name, avatar_path, created_at";
/** Used when migration 0027 is not applied yet — keeps existing accounts working. */
const USERS_SELECT_WITHOUT_SUPPORT_PROVIDER =
  "id, org_id, role, app_role_id, email, full_name, first_name, last_name, avatar_path, created_at";
const USERS_SELECT_NO_PROFILE =
  "id, org_id, role, app_role_id, email, full_name, created_at";
const USERS_SELECT_LEGACY = "id, org_id, role, email, full_name, created_at";

function normalizeUsersRow(
  data: Record<string, unknown>,
  extras: Partial<UsersRow> = {}
): UsersRow {
  return {
    ...data,
    support_provider_id: (data.support_provider_id as string | null | undefined) ?? null,
    app_role_id: (data.app_role_id as string | null | undefined) ?? null,
    first_name: (data.first_name as string | null | undefined) ?? null,
    last_name: (data.last_name as string | null | undefined) ?? null,
    avatar_path: (data.avatar_path as string | null | undefined) ?? null,
    vendor_id: (data.vendor_id as string | null | undefined) ?? null,
    ...extras,
  } as UsersRow;
}

/**
 * Loads `public.users` with graceful fallbacks when optional columns are missing
 * (pre-0027 DB, pre-0005 app_roles, pre-0014 profile fields).
 */
export async function fetchUsersRow(
  supabase: SupabaseClient,
  userId: string
): Promise<UsersRow | null> {
  const full = await supabase.from("users").select(USERS_SELECT_FULL).eq("id", userId).maybeSingle();
  if (!full.error && full.data) {
    return full.data as UsersRow;
  }

  const errMsg = full.error?.message;
  if (errMsg && (isMissingSupportProviderColumnError(errMsg) || isMissingProfileColumnError(errMsg))) {
    const withoutProvider = await supabase
      .from("users")
      .select(USERS_SELECT_WITHOUT_SUPPORT_PROVIDER)
      .eq("id", userId)
      .maybeSingle();

    if (!withoutProvider.error && withoutProvider.data) {
      return normalizeUsersRow(withoutProvider.data as Record<string, unknown>, {
        support_provider_id: null,
      });
    }

    if (withoutProvider.error?.message && isMissingProfileColumnError(withoutProvider.error.message)) {
      const noProfile = await supabase
        .from("users")
        .select(USERS_SELECT_NO_PROFILE)
        .eq("id", userId)
        .maybeSingle();

      if (!noProfile.error && noProfile.data) {
        return normalizeUsersRow(noProfile.data as Record<string, unknown>, {
          support_provider_id: null,
          first_name: null,
          last_name: null,
          avatar_path: null,
        });
      }

      if (noProfile.error && isMissingAppRoleIdColumnError(noProfile.error.message)) {
        const legacy = await supabase.from("users").select(USERS_SELECT_LEGACY).eq("id", userId).maybeSingle();
        if (legacy.data) {
          return normalizeUsersRow(legacy.data as Record<string, unknown>, {
            app_role_id: null,
            support_provider_id: null,
            first_name: null,
            last_name: null,
            avatar_path: null,
          });
        }
      }
      return noProfile.data
        ? normalizeUsersRow(noProfile.data as Record<string, unknown>, {
            support_provider_id: null,
            first_name: null,
            last_name: null,
            avatar_path: null,
          })
        : null;
    }

    if (withoutProvider.error && isMissingAppRoleIdColumnError(withoutProvider.error.message)) {
      const legacy = await supabase.from("users").select(USERS_SELECT_LEGACY).eq("id", userId).maybeSingle();
      if (legacy.data) {
        return normalizeUsersRow(legacy.data as Record<string, unknown>, {
          app_role_id: null,
          support_provider_id: null,
          first_name: null,
          last_name: null,
          avatar_path: null,
        });
      }
    }
  }

  if (errMsg && isMissingAppRoleIdColumnError(errMsg)) {
    const legacy = await supabase.from("users").select(USERS_SELECT_LEGACY).eq("id", userId).maybeSingle();
    if (legacy.data) {
      return normalizeUsersRow(legacy.data as Record<string, unknown>, {
        app_role_id: null,
        support_provider_id: null,
        first_name: null,
        last_name: null,
        avatar_path: null,
      });
    }
  }

  return full.data ? (full.data as UsersRow) : null;
}

/** @deprecated Prefer fetchUsersRow — kept as alias for existing imports */
export async function getUsersRowForAuthUser(userId: string): Promise<UsersRow | null> {
  const supabase = await createClient();
  return fetchUsersRow(supabase, userId);
}

/** Session read first; service role if RLS hides the row (never creates a new profile). */
export async function getUsersRowWithAdminFallback(userId: string): Promise<UsersRow | null> {
  const fromSession = await getUsersRowForAuthUser(userId);
  if (fromSession) return fromSession;

  const admin = createAdminClient();
  return fetchUsersRow(admin, userId);
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  return getUsersRowWithAdminFallback(user.id);
}

/**
 * Session exists but no `public.users` row would send users to `/login`, while middleware
 * sends logged-in users from `/login` back to `/app` — an infinite redirect. Send them here instead.
 */
export async function requireProfileForApp() {
  const profile = await getCurrentProfile();
  if (profile) return profile;

  const user = await getSessionUser();
  if (user) {
    redirect("/app/needs-profile");
  }
  redirect("/login?next=/app");
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/app");
  }
  return user;
}

export async function requireRole(allowed: UserRole | UserRole[]) {
  const profile = await requireProfileForApp();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(profile.role)) {
    redirect("/app");
  }
  return profile;
}

/**
 * Requires a facility org for org-scoped pages.
 * Members use profile.org_id; super admins use the sidebar cookie (or ?org=).
 */
export async function requireOrg(queryOrg?: string | null) {
  const profile = await requireProfileForApp();
  const facilityOrgId = profile.org_id ?? (await resolveActiveOrgId(profile, queryOrg));
  if (!facilityOrgId) {
    redirect("/app/no-organization");
  }
  if (profile.org_id) return profile;
  return { ...profile, org_id: facilityOrgId };
}
