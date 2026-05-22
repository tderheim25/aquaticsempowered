"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireOrg, requireRole } from "@/lib/auth/rbac";
import {
  ORG_ROLE_LABELS,
  buildAppUrl,
  buildInviteSignupUrl,
  generateInviteToken,
  isOrgRole,
  resolveBaseUrl,
} from "@/lib/orgInvitations";
import { sendOrgInvitationEmail } from "@/lib/resend";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function updateOrgMemberRoleAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !isOrgRole(role)) {
    redirect("/app/team?status=invalid");
  }

  const supabase = await createClient();
  const { data: target } = await supabase.from("users").select("id, org_id").eq("id", userId).maybeSingle();

  if (!target || target.org_id !== actor.org_id) {
    redirect("/app/team?status=invalid");
  }

  const { data: appRole } = await supabase.from("app_roles").select("id").eq("slug", role).maybeSingle();

  const { error } = await supabase
    .from("users")
    .update({
      role,
      ...(appRole?.id ? { app_role_id: appRole.id } : {}),
    })
    .eq("id", userId)
    .eq("org_id", actor.org_id);

  if (error) {
    redirect("/app/team?status=error");
  }

  revalidatePath("/app/team");
  redirect("/app/team?status=updated");
}

/** Full details update via the edit-member dialog. */
export async function updateOrgMemberDetailsAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const userId = String(formData.get("userId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!userId || !isOrgRole(role)) {
    redirect("/app/team?status=invalid");
  }

  if (actor.id === userId && role !== "org_admin") {
    redirect("/app/team?status=self");
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id, org_id").eq("id", userId).maybeSingle();

  if (!target || target.org_id !== actor.org_id) {
    redirect("/app/team?status=invalid");
  }

  const { data: appRole } = await admin.from("app_roles").select("id").eq("slug", role).maybeSingle();

  const { error } = await admin
    .from("users")
    .update({
      full_name: fullName || null,
      role,
      ...(appRole?.id ? { app_role_id: appRole.id } : {}),
    })
    .eq("id", userId)
    .eq("org_id", actor.org_id);

  if (error) {
    redirect("/app/team?status=error");
  }

  revalidatePath("/app/team");
  redirect("/app/team?status=updated");
}

/**
 * Invite a teammate to the org.
 *  - New users: an email is sent with a signup link carrying an invite token.
 *  - Existing users: a pending invitation lands in their notifications — they accept in-app.
 */
export async function inviteOrgMemberAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "staff");
  const role: UserRole = isOrgRole(roleRaw) ? roleRaw : "staff";

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmail) {
    redirect("/app/team?status=invalid");
  }

  const admin = createAdminClient();

  const { data: existingUser } = await admin
    .from("users")
    .select("id, org_id, full_name, email")
    .eq("email", email)
    .maybeSingle();

  if (existingUser?.org_id && existingUser.org_id === actor.org_id) {
    redirect("/app/team?status=already-member");
  }
  if (existingUser?.org_id && existingUser.org_id !== actor.org_id) {
    redirect("/app/team?status=email-taken");
  }

  const { data: appRole } = await admin.from("app_roles").select("id").eq("slug", role).maybeSingle();

  await admin
    .from("org_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("org_id", actor.org_id)
    .eq("status", "pending")
    .ilike("email", email);

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: inviteErr } = await admin
    .from("org_invitations")
    .insert({
      org_id: actor.org_id,
      email,
      full_name: fullName,
      role,
      app_role_id: appRole?.id ?? null,
      token,
      status: "pending",
      invited_by: actor.id,
      invited_user_id: existingUser?.id ?? null,
      message,
      expires_at: expiresAt,
    })
    .select("id, token, expires_at")
    .single();

  if (inviteErr || !invite) {
    captureException(inviteErr, { step: "org_invitation_insert" });
    redirect("/app/team?status=invite-failed");
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    revalidatePath("/app/team");
    redirect("/app/team?status=invite-email-not-configured");
  }

  try {
    const hdrs = await headers();
    const origin = hdrs.get("origin") || `${hdrs.get("x-forwarded-proto") ?? "https"}://${hdrs.get("host") ?? ""}`;
    const baseUrl = resolveBaseUrl(origin);

    const { data: org } = await admin.from("organizations").select("name").eq("id", actor.org_id).maybeSingle();
    const orgName = org?.name ?? "your organization";
    const inviterName =
      actor.full_name?.trim() ||
      (actor as { first_name?: string | null }).first_name?.trim() ||
      actor.email;

    await sendOrgInvitationEmail(email, {
      orgName,
      inviterName,
      recipientName: fullName ?? existingUser?.full_name ?? null,
      roleLabel: ORG_ROLE_LABELS[role] ?? role,
      signupUrl: buildInviteSignupUrl(baseUrl, invite.token),
      appUrl: buildAppUrl(baseUrl),
      isExistingUser: Boolean(existingUser),
      message,
      expiresAt: new Date(invite.expires_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  } catch (e) {
    captureException(e, { step: "org_invitation_email" });
    revalidatePath("/app/team");
    redirect("/app/team?status=invite-email-failed");
  }

  revalidatePath("/app/team");
  redirect(existingUser ? "/app/team?status=invited-existing" : "/app/team?status=invited");
}

/** Cancel a still-pending invitation (org admin only). */
export async function cancelOrgInvitationAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) {
    redirect("/app/team?status=invalid");
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("org_invitations")
    .select("id, org_id, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invite || invite.org_id !== actor.org_id) {
    redirect("/app/team?status=invalid");
  }
  if (invite.status !== "pending") {
    redirect("/app/team?status=already-resolved");
  }

  const { error } = await admin
    .from("org_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (error) {
    redirect("/app/team?status=error");
  }

  revalidatePath("/app/team");
  redirect("/app/team?status=invite-cancelled");
}

/** Resend an existing pending invitation (refreshes the token + expiry). */
export async function resendOrgInvitationAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) {
    redirect("/app/team?status=invalid");
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("org_invitations")
    .select("id, org_id, email, full_name, role, app_role_id, status, message, invited_user_id")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invite || invite.org_id !== actor.org_id) {
    redirect("/app/team?status=invalid");
  }
  if (invite.status !== "pending") {
    redirect("/app/team?status=already-resolved");
  }

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin
    .from("org_invitations")
    .update({ token, expires_at: expiresAt })
    .eq("id", invitationId);

  if (error) {
    redirect("/app/team?status=error");
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    revalidatePath("/app/team");
    redirect("/app/team?status=invite-email-not-configured");
  }

  try {
    const hdrs = await headers();
    const origin = hdrs.get("origin") || `${hdrs.get("x-forwarded-proto") ?? "https"}://${hdrs.get("host") ?? ""}`;
    const baseUrl = resolveBaseUrl(origin);

    const { data: org } = await admin.from("organizations").select("name").eq("id", actor.org_id).maybeSingle();
    const orgName = org?.name ?? "your organization";
    const inviterName = actor.full_name?.trim() || actor.email;

    await sendOrgInvitationEmail(invite.email, {
      orgName,
      inviterName,
      recipientName: invite.full_name,
      roleLabel: ORG_ROLE_LABELS[invite.role] ?? invite.role,
      signupUrl: buildInviteSignupUrl(baseUrl, token),
      appUrl: buildAppUrl(baseUrl),
      isExistingUser: Boolean(invite.invited_user_id),
      message: invite.message,
      expiresAt: new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  } catch (e) {
    captureException(e, { step: "org_invitation_resend_email" });
    revalidatePath("/app/team");
    redirect("/app/team?status=invite-email-failed");
  }

  revalidatePath("/app/team");
  redirect("/app/team?status=invite-resent");
}

/** Removes a member from THIS org (does not delete the auth/profile record). */
export async function removeOrgMemberAction(formData: FormData) {
  const actor = await requireRole("org_admin");
  await requireOrg();
  if (!actor.org_id) redirect("/app/no-organization");

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    redirect("/app/team?status=invalid");
  }

  if (actor.id === userId) {
    redirect("/app/team?status=self");
  }

  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id, org_id").eq("id", userId).maybeSingle();
  if (!target || target.org_id !== actor.org_id) {
    redirect("/app/team?status=invalid");
  }

  const { error } = await admin
    .from("users")
    .update({ org_id: null })
    .eq("id", userId)
    .eq("org_id", actor.org_id);

  if (error) {
    redirect("/app/team?status=error");
  }

  revalidatePath("/app/team");
  redirect("/app/team?status=removed");
}
