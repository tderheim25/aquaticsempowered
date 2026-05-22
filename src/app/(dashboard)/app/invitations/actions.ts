"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { isInviteExpired } from "@/lib/orgInvitations";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

type ResolutionResult =
  | { ok: true; status: "accepted" | "declined"; orgId: string | null }
  | { ok: false; error: string };

async function findPendingInvitation(invitationId: string, email: string, userId: string) {
  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("org_invitations")
    .select("id, org_id, email, role, app_role_id, status, expires_at")
    .eq("id", invitationId)
    .maybeSingle();
  if (error || !invite) return { invite: null };
  if (invite.status !== "pending") return { invite: null };
  if (invite.email.toLowerCase() !== email.toLowerCase()) return { invite: null };
  if (isInviteExpired(invite.expires_at)) {
    await admin.from("org_invitations").update({ status: "expired" }).eq("id", invitationId);
    return { invite: null };
  }
  return { invite, admin, userId };
}

/** Accept a pending invitation — links the current user to the org with the chosen role. */
export async function acceptOrgInvitationAction(formData: FormData): Promise<void> {
  const profile = await requireProfileForApp();
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/app").trim() || "/app";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/app";

  if (!invitationId) {
    redirect(`${safeRedirect}?invite_status=invalid`);
  }

  const res = await resolveInvitation({ invitationId, profileId: profile.id, profileEmail: profile.email, accept: true });
  if (!res.ok) {
    redirect(`${safeRedirect}?invite_status=${encodeURIComponent(res.error)}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/team");
  redirect(`${safeRedirect}?invite_status=accepted`);
}

/** Decline a pending invitation. */
export async function declineOrgInvitationAction(formData: FormData): Promise<void> {
  const profile = await requireProfileForApp();
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/app").trim() || "/app";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/app";

  if (!invitationId) {
    redirect(`${safeRedirect}?invite_status=invalid`);
  }

  const res = await resolveInvitation({ invitationId, profileId: profile.id, profileEmail: profile.email, accept: false });
  if (!res.ok) {
    redirect(`${safeRedirect}?invite_status=${encodeURIComponent(res.error)}`);
  }

  revalidatePath("/app");
  redirect(`${safeRedirect}?invite_status=declined`);
}

async function resolveInvitation({
  invitationId,
  profileId,
  profileEmail,
  accept,
}: {
  invitationId: string;
  profileId: string;
  profileEmail: string;
  accept: boolean;
}): Promise<ResolutionResult> {
  const lookup = await findPendingInvitation(invitationId, profileEmail, profileId);
  if (!lookup.invite || !lookup.admin) {
    return { ok: false, error: "expired" };
  }
  const { invite, admin } = lookup;

  const now = new Date().toISOString();

  if (!accept) {
    const { error } = await admin
      .from("org_invitations")
      .update({ status: "declined", responded_at: now, invited_user_id: profileId })
      .eq("id", invitationId);
    if (error) {
      captureException(error, { step: "org_invitation_decline" });
      return { ok: false, error: "error" };
    }
    return { ok: true, status: "declined", orgId: null };
  }

  // accept: ensure the user is unlinked from any other org, then attach.
  const { error: userErr } = await admin
    .from("users")
    .update({
      org_id: invite.org_id,
      role: invite.role,
      ...(invite.app_role_id ? { app_role_id: invite.app_role_id } : {}),
    })
    .eq("id", profileId);

  if (userErr) {
    captureException(userErr, { step: "org_invitation_accept_user_update" });
    return { ok: false, error: "error" };
  }

  const { error: invErr } = await admin
    .from("org_invitations")
    .update({ status: "accepted", responded_at: now, invited_user_id: profileId })
    .eq("id", invitationId);

  if (invErr) {
    captureException(invErr, { step: "org_invitation_accept_status_update" });
    return { ok: false, error: "error" };
  }

  // Cancel any other pending invitations for this email (we just resolved one).
  await admin
    .from("org_invitations")
    .update({ status: "cancelled", responded_at: now })
    .eq("status", "pending")
    .ilike("email", profileEmail)
    .neq("id", invitationId);

  return { ok: true, status: "accepted", orgId: invite.org_id };
}

/**
 * Used by the signup page after a brand-new user creates their account.
 * Consumes an invitation token (verifies the email matches the new account) and links
 * the user to the org. Returns OK regardless of whether RLS lets the user read the org back
 * because the admin client bypasses RLS for the link step.
 */
export async function consumeInviteTokenAction(token: string): Promise<{
  ok: boolean;
  orgId?: string | null;
  kind?: "org" | "technician";
  error?: string;
}> {
  const profile = await requireProfileForApp();
  if (!token) return { ok: false, error: "missing_token" };

  const admin = createAdminClient();

  const { data: orgInvite } = await admin
    .from("org_invitations")
    .select("id, org_id, email, role, app_role_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (orgInvite) {
    if (orgInvite.status !== "pending") return { ok: false, error: "invalid_or_consumed" };
    if (isInviteExpired(orgInvite.expires_at)) {
      await admin.from("org_invitations").update({ status: "expired" }).eq("id", orgInvite.id);
      return { ok: false, error: "expired" };
    }
    if (orgInvite.email.toLowerCase() !== profile.email.toLowerCase()) {
      return { ok: false, error: "email_mismatch" };
    }

    const { error: userErr } = await admin
      .from("users")
      .update({
        org_id: orgInvite.org_id,
        role: orgInvite.role,
        support_provider_id: null,
        ...(orgInvite.app_role_id ? { app_role_id: orgInvite.app_role_id } : {}),
      })
      .eq("id", profile.id);

    if (userErr) {
      captureException(userErr, { step: "consume_invite_user_update" });
      return { ok: false, error: "error" };
    }

    const now = new Date().toISOString();
    await admin
      .from("org_invitations")
      .update({ status: "accepted", responded_at: now, invited_user_id: profile.id })
      .eq("id", orgInvite.id);

    await admin
      .from("org_invitations")
      .update({ status: "cancelled", responded_at: now })
      .eq("status", "pending")
      .ilike("email", profile.email)
      .neq("id", orgInvite.id);

    revalidatePath("/app");
    revalidatePath("/app/team");
    return { ok: true, orgId: orgInvite.org_id, kind: "org" };
  }

  const { data: techInvite } = await admin
    .from("support_technician_invitations")
    .select("id, support_provider_id, email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!techInvite || techInvite.status !== "pending") return { ok: false, error: "invalid_or_consumed" };
  if (isInviteExpired(techInvite.expires_at)) {
    await admin.from("support_technician_invitations").update({ status: "expired" }).eq("id", techInvite.id);
    return { ok: false, error: "expired" };
  }
  if (techInvite.email.toLowerCase() !== profile.email.toLowerCase()) {
    return { ok: false, error: "email_mismatch" };
  }

  const { data: techRole } = await admin
    .from("app_roles")
    .select("id")
    .eq("slug", "support_technician")
    .maybeSingle();

  const role: UserRole = "support_technician";
  const { error: userErr } = await admin
    .from("users")
    .update({
      org_id: null,
      role,
      support_provider_id: techInvite.support_provider_id,
      ...(techRole?.id ? { app_role_id: techRole.id } : {}),
    })
    .eq("id", profile.id);

  if (userErr) {
    captureException(userErr, { step: "consume_technician_invite_user_update" });
    return { ok: false, error: "error" };
  }

  const now = new Date().toISOString();
  await admin
    .from("support_technician_invitations")
    .update({ status: "accepted", responded_at: now, invited_user_id: profile.id })
    .eq("id", techInvite.id);

  await admin
    .from("support_technician_invitations")
    .update({ status: "cancelled", responded_at: now })
    .eq("status", "pending")
    .ilike("email", profile.email)
    .neq("id", techInvite.id);

  revalidatePath("/app");
  revalidatePath("/portal");
  return { ok: true, orgId: null, kind: "technician" };
}
