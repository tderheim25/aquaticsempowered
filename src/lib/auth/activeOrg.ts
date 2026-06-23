import "server-only";

import { cookies } from "next/headers";

import {
  ACTIVE_ORG_COOKIE,
  SUPER_ADMIN_ORG_COOKIE,
  isUuid,
  type OrgOption,
} from "@/lib/auth/activeOrgShared";
import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, PlanCode } from "@/types/database";

export type UsersRow = Database["public"]["Tables"]["users"]["Row"];

export {
  ACTIVE_ORG_COOKIE,
  SUPER_ADMIN_ORG_COOKIE,
  hrefWithOrg,
  isUuid,
  type OrgOption,
} from "@/lib/auth/activeOrgShared";

/** Persisted facility context from cookie (super admin or multi-facility owner). */
export async function readActiveOrgCookie(): Promise<string | null> {
  const store = await cookies();
  const raw =
    store.get(ACTIVE_ORG_COOKIE)?.value?.trim() ??
    store.get(SUPER_ADMIN_ORG_COOKIE)?.value?.trim();
  return isUuid(raw) ? raw : null;
}

/** @deprecated Use readActiveOrgCookie */
export async function readSuperAdminOrgCookie(): Promise<string | null> {
  return readActiveOrgCookie();
}

export async function loadSuperAdminOrgOptions(): Promise<OrgOption[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("organizations").select("id, name").order("name").limit(300);
  return data ?? [];
}

export async function loadUserOrgMemberships(userId: string): Promise<OrgOption[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_memberships")
    .select("org_id, organizations(name)")
    .eq("user_id", userId)
    .order("created_at");

  return (data ?? []).map((row) => {
    const org = row.organizations;
    const name =
      org && typeof org === "object" && "name" in org && typeof org.name === "string"
        ? org.name
        : "Facility";
    return { id: row.org_id, name };
  });
}

export async function userHasOrgMembership(userId: string, orgId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

export async function readUserActiveOrgPreference(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_preferences")
    .select("active_org_id")
    .eq("user_id", userId)
    .maybeSingle();
  const id = data?.active_org_id;
  return isUuid(id) ? id : null;
}

async function isOrgAccessible(
  profile: UsersRow,
  orgId: string,
  memberships: OrgOption[],
): Promise<boolean> {
  if (profile.role === "super_admin") return true;
  if (memberships.some((m) => m.id === orgId)) return true;
  return profile.org_id === orgId;
}

/**
 * Active organization for the session.
 * - Multi-facility owners: ?org= → cookie → user_preferences → first membership → profile.org_id
 * - Super admin (no org): ?org= → cookie (never auto-picks first org)
 * - Single-org members: profile.org_id
 */
export async function resolveActiveOrgId(
  profile: UsersRow,
  queryOrg?: string | null,
): Promise<string | null> {
  const memberships = await loadUserOrgMemberships(profile.id);
  const hasMultiFacility = memberships.length > 1;

  if (profile.role === "super_admin" && !profile.org_id) {
    const fromQuery = queryOrg?.trim();
    if (isUuid(fromQuery)) return fromQuery;
    return readActiveOrgCookie();
  }

  if (hasMultiFacility || memberships.length === 1) {
    const fromQuery = queryOrg?.trim();
    if (isUuid(fromQuery) && (await isOrgAccessible(profile, fromQuery, memberships))) {
      return fromQuery;
    }

    const fromCookie = await readActiveOrgCookie();
    if (fromCookie && (await isOrgAccessible(profile, fromCookie, memberships))) {
      return fromCookie;
    }

    const fromPreference = await readUserActiveOrgPreference(profile.id);
    if (fromPreference && (await isOrgAccessible(profile, fromPreference, memberships))) {
      return fromPreference;
    }

    if (memberships.length > 0) return memberships[0]!.id;
  }

  return profile.org_id;
}

export type ActiveOrgContext = {
  activeOrgId: string | null;
  activeOrgName: string | null;
  billingRootOrgId: string | null;
  planCode: PlanCode;
  isFounder: boolean;
  orgOptions: OrgOption[];
  showOrgSwitcher: boolean;
  canCreateFacility: boolean;
  hasActiveOrg: boolean;
};

export async function loadCanCreateFacility(
  userId: string,
  billingRootOrgId: string | null,
): Promise<boolean> {
  if (!billingRootOrgId) return false;

  const admin = createAdminClient();
  const [{ data: membership }, { data: rootOrg }] = await Promise.all([
    admin
      .from("organization_memberships")
      .select("is_owner")
      .eq("user_id", userId)
      .eq("org_id", billingRootOrgId)
      .maybeSingle(),
    admin.from("organizations").select("plan_code").eq("id", billingRootOrgId).maybeSingle(),
  ]);

  if (!membership?.is_owner) return false;
  const plan = rootOrg?.plan_code;
  return plan === "essential" || plan === "pro";
}

export async function loadActiveOrgContext(
  profile: UsersRow | null,
  queryOrg?: string | null,
): Promise<ActiveOrgContext> {
  const empty: ActiveOrgContext = {
    activeOrgId: null,
    activeOrgName: null,
    billingRootOrgId: null,
    planCode: "free",
    isFounder: false,
    orgOptions: [],
    showOrgSwitcher: false,
    canCreateFacility: false,
    hasActiveOrg: false,
  };

  if (!profile) return empty;

  const memberships = await loadUserOrgMemberships(profile.id);
  const isSuperAdminPicker = profile.role === "super_admin" && !profile.org_id;
  const showOrgSwitcher = isSuperAdminPicker || memberships.length > 1;
  const orgOptions = isSuperAdminPicker
    ? await loadSuperAdminOrgOptions()
    : memberships;

  const activeOrgId = await resolveActiveOrgId(profile, queryOrg);
  if (!activeOrgId) {
    return { ...empty, orgOptions, showOrgSwitcher };
  }

  const admin = createAdminClient();
  const billingRootOrgId = await resolveBillingRootOrgId(activeOrgId);

  const [{ data: facilityOrg }, { data: rootOrg }] = await Promise.all([
    admin.from("organizations").select("name").eq("id", activeOrgId).maybeSingle(),
    admin
      .from("organizations")
      .select("plan_code, founder")
      .eq("id", billingRootOrgId)
      .maybeSingle(),
  ]);

  const canCreateFacility = await loadCanCreateFacility(profile.id, billingRootOrgId);

  return {
    activeOrgId,
    activeOrgName: facilityOrg?.name ?? null,
    billingRootOrgId,
    planCode: (rootOrg?.plan_code as PlanCode) ?? "free",
    isFounder: Boolean(rootOrg?.founder) || Boolean(profile.is_founder),
    orgOptions,
    showOrgSwitcher,
    canCreateFacility,
    hasActiveOrg: true,
  };
}
