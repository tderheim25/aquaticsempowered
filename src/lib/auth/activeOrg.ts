import "server-only";

import { cookies } from "next/headers";

import {
  SUPER_ADMIN_ORG_COOKIE,
  isUuid,
  type OrgOption,
} from "@/lib/auth/activeOrgShared";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, PlanCode } from "@/types/database";

export type UsersRow = Database["public"]["Tables"]["users"]["Row"];

export {
  SUPER_ADMIN_ORG_COOKIE,
  hrefWithOrg,
  isUuid,
  type OrgOption,
} from "@/lib/auth/activeOrgShared";

/** Persisted facility context for super admins (not stored on public.users.org_id). */
export async function readSuperAdminOrgCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SUPER_ADMIN_ORG_COOKIE)?.value?.trim();
  return isUuid(raw) ? raw : null;
}

export async function loadSuperAdminOrgOptions(): Promise<OrgOption[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("organizations").select("id, name").order("name").limit(300);
  return data ?? [];
}

/**
 * Active organization for the session.
 * - Members: always profile.org_id
 * - Super admin: ?org= query wins, else sidebar cookie (never auto-picks first org)
 */
export async function resolveActiveOrgId(
  profile: UsersRow,
  queryOrg?: string | null
): Promise<string | null> {
  if (profile.org_id) return profile.org_id;
  if (profile.role !== "super_admin") return null;

  const fromQuery = queryOrg?.trim();
  if (isUuid(fromQuery)) return fromQuery;

  return readSuperAdminOrgCookie();
}

export type ActiveOrgContext = {
  activeOrgId: string | null;
  activeOrgName: string | null;
  planCode: PlanCode;
  orgOptions: OrgOption[];
  showOrgSwitcher: boolean;
  hasActiveOrg: boolean;
};

export async function loadActiveOrgContext(
  profile: UsersRow | null,
  queryOrg?: string | null
): Promise<ActiveOrgContext> {
  const empty: ActiveOrgContext = {
    activeOrgId: null,
    activeOrgName: null,
    planCode: "free",
    orgOptions: [],
    showOrgSwitcher: false,
    hasActiveOrg: false,
  };

  if (!profile) return empty;

  const showOrgSwitcher = profile.role === "super_admin" && !profile.org_id;
  const orgOptions = showOrgSwitcher ? await loadSuperAdminOrgOptions() : [];

  const activeOrgId = await resolveActiveOrgId(profile, queryOrg);
  if (!activeOrgId) {
    return { ...empty, orgOptions, showOrgSwitcher };
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("name, plan_code")
    .eq("id", activeOrgId)
    .maybeSingle();

  return {
    activeOrgId,
    activeOrgName: org?.name ?? null,
    planCode: (org?.plan_code as PlanCode) ?? "free",
    orgOptions,
    showOrgSwitcher,
    hasActiveOrg: true,
  };
}
