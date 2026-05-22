"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { consoleSectionUrl, getSuperAdminPortalPath, requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import {
  buildAppUrl,
  buildInviteSignupUrl,
  generateInviteToken,
  resolveBaseUrl,
} from "@/lib/orgInvitations";
import { sendSupportTechnicianInvitationEmail } from "@/lib/resend";
import { captureException } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Super admin invites a support technician by email. New users receive a signup link;
 * existing users accept via the invitation accept flow after sign-in.
 */
export async function inviteSupportTechnicianAction(formData: FormData) {
  const actor = await requireSuperAdminConsole();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const supportProviderId = String(formData.get("supportProviderId") ?? "").trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmail || !supportProviderId) {
    redirect(consoleSectionUrl("support_providers", { status: "invalid" }));
  }

  const admin = createAdminClient();

  const { data: provider, error: providerErr } = await admin
    .from("support_providers")
    .select("id, name, is_active")
    .eq("id", supportProviderId)
    .maybeSingle();

  if (providerErr || !provider) {
    redirect(consoleSectionUrl("support_providers", { status: "invalid" }));
  }

  const { data: existingUser } = await admin
    .from("users")
    .select("id, role, support_provider_id, full_name, email")
    .eq("email", email)
    .maybeSingle();

  if (
    existingUser?.role === "support_technician" &&
    existingUser.support_provider_id === supportProviderId
  ) {
    redirect(consoleSectionUrl("support_providers", { status: "already-member" }));
  }

  await admin
    .from("support_technician_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("support_provider_id", supportProviderId)
    .eq("status", "pending")
    .ilike("email", email);

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: inviteErr } = await admin
    .from("support_technician_invitations")
    .insert({
      support_provider_id: supportProviderId,
      email,
      full_name: fullName,
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
    captureException(inviteErr, { step: "support_technician_invitation_insert" });
    redirect(consoleSectionUrl("support_providers", { status: "invite-failed" }));
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const hdrs = await headers();
      const origin =
        hdrs.get("origin") || `${hdrs.get("x-forwarded-proto") ?? "https"}://${hdrs.get("host") ?? ""}`;
      const baseUrl = resolveBaseUrl(origin);
      const inviterName =
        actor.full_name?.trim() ||
        (actor as { first_name?: string | null }).first_name?.trim() ||
        actor.email;

      const acceptPath = `/app/invitations/accept?token=${encodeURIComponent(invite.token)}&next=${encodeURIComponent("/portal/queue")}`;
      const appUrl = existingUser ? `${baseUrl}${acceptPath}` : buildAppUrl(baseUrl);

      await sendSupportTechnicianInvitationEmail(email, {
        providerName: provider.name,
        inviterName,
        recipientName: fullName ?? existingUser?.full_name ?? null,
        signupUrl: buildInviteSignupUrl(baseUrl, invite.token),
        appUrl: existingUser ? appUrl : buildAppUrl(baseUrl),
        isExistingUser: Boolean(existingUser),
        message,
        expiresAt: new Date(invite.expires_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      });
    } catch (e) {
      captureException(e, { step: "support_technician_invitation_email" });
    }
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(
    existingUser
      ? consoleSectionUrl("support_providers", { status: "tech-invited-existing" })
      : consoleSectionUrl("support_providers", { status: "tech-invited" }),
  );
}

/** Resend a pending support technician invitation (refreshes token + expiry, resends email). */
export async function resendSupportTechnicianInvitationAction(formData: FormData) {
  const actor = await requireSuperAdminConsole();

  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) {
    redirect(consoleSectionUrl("support_providers", { status: "invalid" }));
  }

  const admin = createAdminClient();
  const { data: invite, error: inviteLoadErr } = await admin
    .from("support_technician_invitations")
    .select("id, email, full_name, message, status, support_provider_id, invited_user_id, expires_at")
    .eq("id", invitationId)
    .maybeSingle();

  if (inviteLoadErr || !invite || invite.status !== "pending") {
    redirect(consoleSectionUrl("support_providers", { status: "invalid" }));
  }

  const { data: provider } = await admin
    .from("support_providers")
    .select("name")
    .eq("id", invite.support_provider_id)
    .maybeSingle();

  const providerName = provider?.name ?? "Support provider";

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("support_technician_invitations")
    .update({ token, expires_at: expiresAt })
    .eq("id", invitationId);

  if (updateErr) {
    captureException(updateErr, { step: "support_technician_invitation_resend_update" });
    redirect(consoleSectionUrl("support_providers", { status: "invite-failed" }));
  }

  if (!process.env.RESEND_API_KEY) {
    revalidatePath(getSuperAdminPortalPath());
    redirect(consoleSectionUrl("support_providers", { status: "invite-email-not-configured" }));
  }

  try {
    const hdrs = await headers();
    const origin =
      hdrs.get("origin") || `${hdrs.get("x-forwarded-proto") ?? "https"}://${hdrs.get("host") ?? ""}`;
    const baseUrl = resolveBaseUrl(origin);
    const inviterName =
      actor.full_name?.trim() ||
      (actor as { first_name?: string | null }).first_name?.trim() ||
      actor.email;

    const acceptPath = `/app/invitations/accept?token=${encodeURIComponent(token)}&next=${encodeURIComponent("/portal/queue")}`;
    const appUrl = invite.invited_user_id ? `${baseUrl}${acceptPath}` : buildAppUrl(baseUrl);

    await sendSupportTechnicianInvitationEmail(invite.email, {
      providerName,
      inviterName,
      recipientName: invite.full_name,
      signupUrl: buildInviteSignupUrl(baseUrl, token),
      appUrl: invite.invited_user_id ? appUrl : buildAppUrl(baseUrl),
      isExistingUser: Boolean(invite.invited_user_id),
      message: invite.message,
      expiresAt: new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  } catch (e) {
    captureException(e, { step: "support_technician_invitation_resend_email" });
    revalidatePath(getSuperAdminPortalPath());
    redirect(consoleSectionUrl("support_providers", { status: "invite-email-failed" }));
  }

  revalidatePath(getSuperAdminPortalPath());
  redirect(consoleSectionUrl("support_providers", { status: "tech-invite-resent" }));
}
