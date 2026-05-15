import { redirect } from "next/navigation";

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

function isMissingProfileColumnError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("first_name") ||
    m.includes("last_name") ||
    m.includes("avatar_path") ||
    (m.includes("schema cache") && m.includes("users"))
  );
}

const USERS_SELECT_FULL =
  "id, org_id, role, app_role_id, email, full_name, first_name, last_name, avatar_path, created_at";
const USERS_SELECT_NO_PROFILE =
  "id, org_id, role, app_role_id, email, full_name, created_at";
const USERS_SELECT_LEGACY = "id, org_id, role, email, full_name, created_at";

/**
 * Loads `public.users` for RLS-authenticated requests.
 * If migration `0005_app_roles.sql` is not applied yet, selecting `app_role_id` fails and PostgREST returns
 * no row — we retry without that column so existing databases keep working.
 */
export async function getUsersRowForAuthUser(userId: string): Promise<UsersRow | null> {
  const supabase = await createClient();

  const primary = await supabase.from("users").select(USERS_SELECT_FULL).eq("id", userId).maybeSingle();

  if (!primary.error && primary.data) {
    return primary.data as UsersRow;
  }

  if (primary.error?.message && isMissingProfileColumnError(primary.error.message)) {
    const noProfile = await supabase.from("users").select(USERS_SELECT_NO_PROFILE).eq("id", userId).maybeSingle();
    if (!noProfile.error && noProfile.data) {
      return {
        ...noProfile.data,
        first_name: null,
        last_name: null,
        avatar_path: null,
      } as UsersRow;
    }
    if (noProfile.error && isMissingAppRoleIdColumnError(noProfile.error.message)) {
      const legacy = await supabase.from("users").select(USERS_SELECT_LEGACY).eq("id", userId).maybeSingle();
      if (legacy.data) {
        return {
          ...legacy.data,
          app_role_id: null,
          first_name: null,
          last_name: null,
          avatar_path: null,
        } as UsersRow;
      }
    }
    return noProfile.data ? (noProfile.data as UsersRow) : null;
  }

  if (primary.error && isMissingAppRoleIdColumnError(primary.error.message)) {
    const fallback = await supabase.from("users").select(USERS_SELECT_LEGACY).eq("id", userId).maybeSingle();
    if (fallback.data) {
      return {
        ...fallback.data,
        app_role_id: null,
        first_name: null,
        last_name: null,
        avatar_path: null,
      } as UsersRow;
    }
    return null;
  }

  return primary.data ?? null;
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  return getUsersRowForAuthUser(user.id);
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

export async function requireOrg() {
  const profile = await getCurrentProfile();
  if (!profile?.org_id) {
    redirect("/app/no-organization");
  }
  return profile;
}
