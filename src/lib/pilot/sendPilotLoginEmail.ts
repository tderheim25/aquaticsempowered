import "server-only";

import { randomBytes } from "crypto";

import { getRoleDisplayLabel } from "@/lib/auth/roleLabels";
import { resolveBillingRootOrgId } from "@/lib/billing/billingRoot";
import { DEFAULT_PILOT_ACCESS_UNTIL } from "@/lib/pilot/pilotConstants";
import { sendPilotProgramWelcome } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function formatAccessUntil(iso: string | null | undefined): string {
  const value = iso ?? DEFAULT_PILOT_ACCESS_UNTIL;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "September 30, 2026";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export type SendPilotLoginEmailResult =
  | { ok: true }
  | { ok: false; error: string; code?: "not_found" | "no_email" | "email_not_configured" };

/**
 * Resets a user's password and emails pilot-style login credentials.
 * Use from AE Console when welcome email was skipped during import.
 */
export async function sendPilotLoginEmailForUser(userId: string): Promise<SendPilotLoginEmailResult> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY).", code: "email_not_configured" };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileErr } = await admin
    .from("users")
    .select("id, email, full_name, org_id, role, app_role_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return { ok: false, error: "User not found.", code: "not_found" };
  }

  const email = profile.email?.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "User has no email address.", code: "no_email" };
  }

  let orgName = "your organization";
  let accessUntilLabel = formatAccessUntil(null);

  if (profile.org_id) {
    const billingRootId = await resolveBillingRootOrgId(profile.org_id);
    const { data: org } = await admin
      .from("organizations")
      .select("name, pilot_access_until")
      .eq("id", billingRootId)
      .maybeSingle();

    if (org?.name) orgName = org.name;
    accessUntilLabel = formatAccessUntil(org?.pilot_access_until);
  } else {
    const { data: membership } = await admin
      .from("organization_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membership?.org_id) {
      const billingRootId = await resolveBillingRootOrgId(membership.org_id);
      const { data: org } = await admin
        .from("organizations")
        .select("name, pilot_access_until")
        .eq("id", billingRootId)
        .maybeSingle();
      if (org?.name) orgName = org.name;
      accessUntilLabel = formatAccessUntil(org?.pilot_access_until);
    }
  }

  let appRoleLabel: string | null = null;
  let appRoleSlug: string | null = null;
  if (profile.app_role_id) {
    const { data: appRole } = await admin
      .from("app_roles")
      .select("label, slug")
      .eq("id", profile.app_role_id)
      .maybeSingle();
    appRoleLabel = appRole?.label ?? null;
    appRoleSlug = appRole?.slug ?? null;
  }

  const tempPassword = generateTempPassword();
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
    user_metadata: {
      full_name: profile.full_name ?? undefined,
      must_change_password: true,
    },
  });

  if (authErr) {
    return { ok: false, error: authErr.message };
  }

  try {
    await sendPilotProgramWelcome(email, {
      recipientName: profile.full_name?.trim() || email,
      orgName,
      roleLabel: getRoleDisplayLabel({
        role: profile.role,
        appRoleLabel,
        appRoleSlug,
      }),
      email,
      tempPassword,
      accessUntilLabel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send email.";
    return { ok: false, error: message };
  }

  return { ok: true };
}
