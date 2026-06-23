import type { User } from "@supabase/supabase-js";

import { getSessionUser, getUsersRowWithAdminFallback, type UsersRow } from "@/lib/auth/rbac";
import {
  ownerAppRoleSlugForPlan,
  resolveAppRoleIdBySlug,
} from "@/lib/auth/planOwnerRoles";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode, UserRole } from "@/types/database";

function fullNameFromAuthUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const raw =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    "";
  const trimmed = raw.trim();
  return trimmed || null;
}

async function resolveAppRoleId(role: UserRole): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_roles").select("id").eq("slug", role).maybeSingle();
  return data?.id ?? null;
}

type OrgLink = {
  org_id: string;
  role: UserRole;
  app_role_id: string | null;
  invitationId?: string;
};

type TechnicianLink = {
  support_provider_id: string;
  app_role_id: string | null;
  invitationId: string;
};

/** Pending support technician invite for this email. */
async function resolveTechnicianLinkForEmail(email: string): Promise<TechnicianLink | null> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data: invite } = await admin
    .from("support_technician_invitations")
    .select("id, support_provider_id, expires_at, status")
    .eq("status", "pending")
    .ilike("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite?.support_provider_id) return null;

  const expires = invite.expires_at ? new Date(invite.expires_at).getTime() : Infinity;
  if (!Number.isFinite(expires) || expires < Date.now()) return null;

  const app_role_id = await resolveAppRoleId("support_technician");
  return {
    support_provider_id: invite.support_provider_id,
    app_role_id,
    invitationId: invite.id,
  };
}

/** Best-effort org + role from a pending invite or founder lead for this email. */
async function resolveOrgLinkForEmail(email: string): Promise<OrgLink | null> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data: invite } = await admin
    .from("org_invitations")
    .select("id, org_id, role, app_role_id, expires_at, status")
    .eq("status", "pending")
    .ilike("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (invite?.org_id) {
    const expires = invite.expires_at ? new Date(invite.expires_at).getTime() : Infinity;
    if (Number.isFinite(expires) && expires >= Date.now()) {
      return {
        org_id: invite.org_id,
        role: invite.role as UserRole,
        app_role_id: invite.app_role_id,
        invitationId: invite.id,
      };
    }
  }

  const { data: lead } = await admin
    .from("leads")
    .select("org_id, request_type, requested_plan_code")
    .ilike("email", normalized)
    .not("org_id", "is", null)
    .eq("request_type", "founder_account")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lead?.org_id) {
    const planCode = (lead.requested_plan_code as PlanCode | null) ?? "essential";
    const ownerSlug = ownerAppRoleSlugForPlan(planCode);
    const app_role_id = await resolveAppRoleIdBySlug(ownerSlug);
    return { org_id: lead.org_id, role: "org_admin", app_role_id };
  }

  return null;
}

/**
 * Creates a missing `public.users` row for the signed-in auth user only.
 * Never updates an existing row (avoids clobbering super_admin / org_admin).
 */
export async function provisionUserProfileFromSession(): Promise<UsersRow | null> {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return getUsersRowWithAdminFallback(user.id);
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const techLink = await resolveTechnicianLinkForEmail(email);
  const orgLink = techLink ? null : await resolveOrgLinkForEmail(email);
  const role: UserRole = techLink ? "support_technician" : orgLink?.role ?? "staff";

  let app_role_id = techLink?.app_role_id ?? orgLink?.app_role_id ?? null;
  if (!app_role_id) {
    if (role === "staff" && !orgLink?.org_id && !techLink) {
      app_role_id = await resolveAppRoleIdBySlug("default_user");
    } else {
      app_role_id = await resolveAppRoleId(role);
    }
  }

  const row = {
    id: user.id,
    email,
    full_name: fullNameFromAuthUser(user),
    role,
    org_id: techLink ? null : orgLink?.org_id ?? null,
    support_provider_id: techLink?.support_provider_id ?? null,
    ...(app_role_id ? { app_role_id } : {}),
  };

  const { error: insertErr } = await admin.from("users").insert(row);
  if (insertErr) {
    captureException(insertErr, { step: "provision_user_profile" });
    return getUsersRowWithAdminFallback(user.id);
  }

  const now = new Date().toISOString();
  if (techLink?.invitationId) {
    await admin
      .from("support_technician_invitations")
      .update({ status: "accepted", responded_at: now, invited_user_id: user.id })
      .eq("id", techLink.invitationId);
  } else if (orgLink?.invitationId) {
    await admin
      .from("org_invitations")
      .update({ status: "accepted", responded_at: now, invited_user_id: user.id })
      .eq("id", orgLink.invitationId);
  }

  return getUsersRowWithAdminFallback(user.id);
}
