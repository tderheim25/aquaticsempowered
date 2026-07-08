import { randomBytes, randomUUID } from "crypto";

import { syncOwnerAppRoleForOrg } from "@/lib/auth/planOwnerRoles";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgTier, UserRole } from "@/types/database";

import { parsePilotImportCsv, type PilotImportRow } from "./parsePilotImportCsv";
import {
  DEFAULT_PILOT_ACCESS_UNTIL,
  DEFAULT_PILOT_POOL_LICENSE_QUANTITY,
  PILOT_PLAN_CODE,
} from "./pilotConstants";

export type PilotImportRowResult = {
  line: number;
  email: string;
  orgName: string;
  status: "created" | "linked" | "skipped" | "error";
  message?: string;
};

export type PilotImportPreviewOrg = {
  orgName: string;
  exists: boolean;
  userCount: number;
  facilities: string[];
};

export type PilotImportPreview = {
  orgs: PilotImportPreviewOrg[];
  usersToCreate: number;
  usersExisting: number;
  welcomeEmails: number;
  errors: string[];
};

export type PilotImportResult = {
  ok: boolean;
  dryRun: boolean;
  preview?: PilotImportPreview;
  rowResults: PilotImportRowResult[];
  orgsProcessed: string[];
  errors: string[];
};

type OrgCache = {
  billingRootId: string;
  facilities: Map<string, string>;
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function resolveAppRoleId(role: UserRole): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_roles").select("id").eq("slug", role).maybeSingle();
  return data?.id ?? null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id").ilike("email", email).maybeSingle();
  return data?.id ?? null;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const existing = await findUserIdByEmail(email);
  if (existing) return existing;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { users?: { id: string }[] };
    return json.users?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function findBillingRootByName(orgName: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, billing_org_id")
    .ilike("name", orgName)
    .limit(20);

  const match = (data ?? []).find((o) => o.billing_org_id === o.id);
  return match?.id ?? null;
}

async function findFacilityOrg(
  billingRootId: string,
  facilityName: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name")
    .eq("billing_org_id", billingRootId)
    .ilike("name", facilityName)
    .maybeSingle();
  return data?.id ?? null;
}

async function ensureBillingRootOrg(
  orgName: string,
  orgTier: OrgTier | null,
  dryRun: boolean,
): Promise<string | null> {
  const existing = await findBillingRootByName(orgName);
  if (existing) return existing;
  if (dryRun) return null;

  const admin = createAdminClient();
  const orgId = randomUUID();
  const { error } = await admin.from("organizations").insert({
    id: orgId,
    name: orgName,
    tier: orgTier,
    plan_code: PILOT_PLAN_CODE,
    founder: true,
    billing_org_id: orgId,
    pilot_access_until: DEFAULT_PILOT_ACCESS_UNTIL,
  });

  if (error) {
    captureException(error, { step: "pilot_import_billing_root", orgName });
    return null;
  }

  return orgId;
}

async function ensurePilotSubscription(billingRootId: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) return true;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("org_id", billingRootId)
    .maybeSingle();

  const payload = {
    plan_code: PILOT_PLAN_CODE,
    status: "active",
    current_period_end: DEFAULT_PILOT_ACCESS_UNTIL,
    pool_license_quantity: DEFAULT_PILOT_POOL_LICENSE_QUANTITY,
  };

  if (existing?.id) {
    const { error } = await admin.from("subscriptions").update(payload).eq("id", existing.id);
    if (error) {
      captureException(error, { step: "pilot_import_subscription_update", billingRootId });
      return false;
    }
    return true;
  }

  const { error } = await admin.from("subscriptions").insert({
    org_id: billingRootId,
    ...payload,
  });
  if (error) {
    captureException(error, { step: "pilot_import_subscription_insert", billingRootId });
    return false;
  }
  return true;
}

async function ensureFacilityOrg(
  billingRootId: string,
  facilityName: string,
  orgTier: OrgTier | null,
  dryRun: boolean,
): Promise<string | null> {
  const existing = await findFacilityOrg(billingRootId, facilityName);
  if (existing) return existing;

  const admin = createAdminClient();
  const { data: root } = await admin
    .from("organizations")
    .select("plan_code, founder, pilot_access_until")
    .eq("id", billingRootId)
    .maybeSingle();

  if (dryRun) return null;

  const { data: created, error } = await admin
    .from("organizations")
    .insert({
      name: facilityName,
      tier: orgTier,
      plan_code: root?.plan_code ?? PILOT_PLAN_CODE,
      founder: root?.founder ?? true,
      billing_org_id: billingRootId,
      pilot_access_until: root?.pilot_access_until ?? DEFAULT_PILOT_ACCESS_UNTIL,
    })
    .select("id")
    .single();

  if (error || !created) {
    captureException(error ?? new Error("facility insert failed"), {
      step: "pilot_import_facility",
      billingRootId,
      facilityName,
    });
    return null;
  }
  return created.id;
}

async function upsertUserProfile(params: {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  orgId: string;
  isOwner: boolean;
  dryRun: boolean;
}): Promise<boolean> {
  if (params.dryRun) return true;

  const admin = createAdminClient();
  const appRoleId = await resolveAppRoleId(params.role);

  const { data: existing } = await admin
    .from("users")
    .select("id, org_id, is_founder, founder_enrolled_at")
    .eq("id", params.userId)
    .maybeSingle();

  const founderEnrolledAt = existing?.founder_enrolled_at ?? new Date().toISOString();
  const founderFields = {
    is_founder: true,
    founder_enrolled_at: founderEnrolledAt,
  };

  if (existing) {
    const { error } = await admin
      .from("users")
      .update({
        full_name: params.fullName,
        role: params.role,
        org_id: params.orgId,
        ...founderFields,
        ...(appRoleId ? { app_role_id: appRoleId } : {}),
      })
      .eq("id", params.userId);
    if (error) {
      captureException(error, { step: "pilot_import_user_update", userId: params.userId });
      return false;
    }
  } else {
    const { error } = await admin.from("users").insert({
      id: params.userId,
      email: params.email,
      full_name: params.fullName,
      role: params.role,
      org_id: params.orgId,
      ...founderFields,
      ...(appRoleId ? { app_role_id: appRoleId } : {}),
    });
    if (error) {
      captureException(error, { step: "pilot_import_user_insert", userId: params.userId });
      return false;
    }
  }

  const { error: memErr } = await admin.from("organization_memberships").upsert(
    {
      user_id: params.userId,
      org_id: params.orgId,
      role: params.role,
      is_owner: params.isOwner,
    },
    { onConflict: "user_id,org_id" },
  );
  if (memErr) {
    captureException(memErr, { step: "pilot_import_membership", userId: params.userId });
    return false;
  }

  const { error: prefErr } = await admin.from("user_preferences").upsert({
    user_id: params.userId,
    active_org_id: params.orgId,
    updated_at: new Date().toISOString(),
  });
  if (prefErr) {
    captureException(prefErr, { step: "pilot_import_preferences", userId: params.userId });
  }

  return true;
}

async function createAuthUser(
  email: string,
  fullName: string,
  dryRun: boolean,
): Promise<{ userId: string | null; tempPassword: string | null; created: boolean }> {
  const existingId = await findAuthUserIdByEmail(email);
  if (existingId) {
    return { userId: existingId, tempPassword: null, created: false };
  }
  if (dryRun) {
    return { userId: null, tempPassword: "********", created: true };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      must_change_password: true,
    },
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered")) {
      const linkedId = await findAuthUserIdByEmail(email);
      return { userId: linkedId, tempPassword: null, created: false };
    }
    captureException(error, { step: "pilot_import_auth_create", email });
    return { userId: null, tempPassword: null, created: false };
  }

  return { userId: data.user?.id ?? null, tempPassword, created: true };
}

function groupRowsByOrg(rows: PilotImportRow[]): Map<string, PilotImportRow[]> {
  const map = new Map<string, PilotImportRow[]>();
  for (const row of rows) {
    const list = map.get(row.orgName) ?? [];
    list.push(row);
    map.set(row.orgName, list);
  }
  return map;
}

export async function buildPilotImportPreview(csvText: string): Promise<PilotImportPreview | { errors: string[] }> {
  const parsed = parsePilotImportCsv(csvText);
  if (!parsed.ok) return { errors: parsed.errors };

  const orgGroups = groupRowsByOrg(parsed.rows);
  const orgs: PilotImportPreviewOrg[] = [];
  let usersToCreate = 0;
  let usersExisting = 0;
  let welcomeEmails = 0;

  for (const [orgName, orgRows] of orgGroups) {
    const existing = Boolean(await findBillingRootByName(orgName));
    const facilities = Array.from(new Set(orgRows.map((r) => r.facilityName)));

    for (const row of orgRows) {
      const userId = await findAuthUserIdByEmail(row.userEmail);
      if (userId) usersExisting += 1;
      else {
        usersToCreate += 1;
        welcomeEmails += 1;
      }
    }

    orgs.push({
      orgName,
      exists: existing,
      userCount: orgRows.length,
      facilities,
    });
  }

  return { orgs, usersToCreate, usersExisting, welcomeEmails, errors: [] };
}

export type SendWelcomeEmailFn = (params: {
  to: string;
  recipientName: string;
  orgName: string;
  roleLabel: string;
  email: string;
  tempPassword: string;
  accessUntilLabel: string;
}) => Promise<void>;

export async function runPilotBulkImport(options: {
  csvText: string;
  dryRun?: boolean;
  sendWelcomeEmails?: boolean;
  sendWelcomeEmail?: SendWelcomeEmailFn;
}): Promise<PilotImportResult> {
  const dryRun = options.dryRun ?? false;
  const sendWelcomeEmails = options.sendWelcomeEmails ?? false;

  const parsed = parsePilotImportCsv(options.csvText);
  if (!parsed.ok) {
    return { ok: false, dryRun, rowResults: [], orgsProcessed: [], errors: parsed.errors };
  }

  const preview = await buildPilotImportPreview(options.csvText);
  if ("errors" in preview && preview.errors.length > 0) {
    return { ok: false, dryRun, rowResults: [], orgsProcessed: [], errors: preview.errors };
  }

  const rowResults: PilotImportRowResult[] = [];
  const orgsProcessed: string[] = [];
  const errors: string[] = [];
  const orgCache = new Map<string, OrgCache>();

  const orgGroups = groupRowsByOrg(parsed.rows);

  for (const [orgName, orgRows] of orgGroups) {
    const billingRootId = await ensureBillingRootOrg(orgName, orgRows[0]?.orgTier ?? null, dryRun);
    if (!billingRootId && !dryRun) {
      errors.push(`Could not create billing root for org "${orgName}"`);
      for (const row of orgRows) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "error",
          message: "Billing root creation failed",
        });
      }
      continue;
    }

    if (billingRootId && !dryRun) {
      const subOk = await ensurePilotSubscription(billingRootId, dryRun);
      if (!subOk) {
        errors.push(`Could not upsert subscription for "${orgName}"`);
      }
    }

    const cache: OrgCache = {
      billingRootId: billingRootId ?? `dry-run-${orgName}`,
      facilities: new Map(),
    };
    orgCache.set(orgName, cache);
    orgsProcessed.push(orgName);

    for (const row of orgRows) {
      if (!billingRootId && dryRun) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "created",
          message: "Would create user and org",
        });
        continue;
      }

      if (!billingRootId) continue;

      let facilityOrgId = cache.facilities.get(row.facilityName);
      if (!facilityOrgId) {
        if (row.facilityName === orgName) {
          facilityOrgId = billingRootId;
        } else {
          facilityOrgId =
            (await ensureFacilityOrg(billingRootId, row.facilityName, row.orgTier, dryRun)) ??
            undefined;
        }
        if (facilityOrgId) cache.facilities.set(row.facilityName, facilityOrgId);
      }

      if (!facilityOrgId && dryRun) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "created",
          message: "Would create facility and user",
        });
        continue;
      }

      if (!facilityOrgId) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "error",
          message: "Facility org could not be resolved",
        });
        continue;
      }

      const { userId, tempPassword, created } = await createAuthUser(
        row.userEmail,
        row.userFullName,
        dryRun,
      );

      if (!userId && dryRun) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "created",
          message: "Would create auth user",
        });
        continue;
      }

      if (!userId) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "error",
          message: "Auth user could not be created or found",
        });
        continue;
      }

      const profileOk = await upsertUserProfile({
        userId,
        email: row.userEmail,
        fullName: row.userFullName,
        role: row.userRole,
        orgId: facilityOrgId,
        isOwner: row.isOwner,
        dryRun,
      });

      if (!profileOk && !dryRun) {
        rowResults.push({
          line: row.line,
          email: row.userEmail,
          orgName,
          status: "error",
          message: "Profile or membership update failed",
        });
        continue;
      }

      rowResults.push({
        line: row.line,
        email: row.userEmail,
        orgName,
        status: created ? "created" : "linked",
        message: created ? "New account created" : "Linked to existing account",
      });

      if (
        !dryRun &&
        sendWelcomeEmails &&
        created &&
        tempPassword &&
        options.sendWelcomeEmail
      ) {
        try {
          await options.sendWelcomeEmail({
            to: row.userEmail,
            recipientName: row.userFullName,
            orgName,
            roleLabel: row.userRole.replace("_", " "),
            email: row.userEmail,
            tempPassword,
            accessUntilLabel: "September 30, 2026",
          });
        } catch (emailErr) {
          captureException(emailErr, { step: "pilot_import_welcome_email", email: row.userEmail });
          const last = rowResults[rowResults.length - 1];
          if (last) {
            last.message = `${last.message ?? ""} Welcome email failed.`.trim();
          }
        }
      }
    }

    if (!dryRun && billingRootId) {
      try {
        await syncOwnerAppRoleForOrg(billingRootId);
      } catch (syncErr) {
        captureException(syncErr, { step: "pilot_import_sync_roles", orgName });
      }
    }
  }

  const ok = errors.length === 0 && rowResults.every((r) => r.status !== "error");

  return {
    ok,
    dryRun,
    preview: "orgs" in preview ? preview : undefined,
    rowResults,
    orgsProcessed,
    errors,
  };
}
