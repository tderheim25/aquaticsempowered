import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildInviteSignupUrl,
  generateInviteToken,
  isInviteExpired,
  resolveBaseUrl,
} from "@/lib/orgInvitations";

export { buildInviteSignupUrl, generateInviteToken, resolveBaseUrl };

export const SUPPORT_TECHNICIAN_ROLE_LABEL = "Support Technician";

export type PendingTechnicianInvitationItem = {
  id: string;
  supportProviderId: string;
  providerName: string;
  inviterName: string | null;
  message: string | null;
  createdAt: string;
  expiresAt: string;
};

export type SignupTechnicianInvite = {
  kind: "technician";
  id: string;
  supportProviderId: string;
  providerName: string;
  email: string;
  fullName: string | null;
  inviterName: string | null;
  message: string | null;
  expiresAt: string;
};

async function lookupProviderNames(admin: ReturnType<typeof createAdminClient>, providerIds: string[]) {
  if (!providerIds.length) return new Map<string, string>();
  const { data } = await admin.from("support_providers").select("id, name").in("id", providerIds);
  return new Map((data ?? []).map((p) => [p.id, p.name]));
}

async function lookupInviterNames(admin: ReturnType<typeof createAdminClient>, inviterIds: string[]) {
  if (!inviterIds.length) return new Map<string, { full_name: string | null; email: string | null }>();
  const { data } = await admin.from("users").select("id, full_name, email").in("id", inviterIds);
  return new Map((data ?? []).map((u) => [u.id, { full_name: u.full_name, email: u.email }]));
}

export async function loadPendingTechnicianInvitationsForEmail(
  email: string,
): Promise<PendingTechnicianInvitationItem[]> {
  if (!email) return [];
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("support_technician_invitations")
    .select("id, support_provider_id, message, created_at, expires_at, invited_by, status")
    .ilike("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const fresh = data.filter((row) => !isInviteExpired(row.expires_at));
  const providerIds = Array.from(new Set(fresh.map((r) => r.support_provider_id)));
  const inviterIds = Array.from(new Set(fresh.map((r) => r.invited_by).filter((v): v is string => Boolean(v))));

  const [providers, inviters] = await Promise.all([
    lookupProviderNames(admin, providerIds),
    lookupInviterNames(admin, inviterIds),
  ]);

  return fresh.map((row) => {
    const inviter = row.invited_by ? inviters.get(row.invited_by) : null;
    return {
      id: row.id,
      supportProviderId: row.support_provider_id,
      providerName: providers.get(row.support_provider_id) ?? "Support provider",
      inviterName: inviter?.full_name?.trim() || inviter?.email || null,
      message: row.message,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  });
}

/** Look up a pending technician invitation by signup token. */
export async function loadTechnicianInvitationByToken(token: string): Promise<SignupTechnicianInvite | null> {
  if (!token) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_technician_invitations")
    .select("id, support_provider_id, email, full_name, message, status, expires_at, invited_by")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status !== "pending") return null;
  if (isInviteExpired(data.expires_at)) return null;

  const [providers, inviters] = await Promise.all([
    lookupProviderNames(admin, [data.support_provider_id]),
    lookupInviterNames(admin, data.invited_by ? [data.invited_by] : []),
  ]);
  const inviter = data.invited_by ? inviters.get(data.invited_by) : null;

  return {
    kind: "technician",
    id: data.id,
    supportProviderId: data.support_provider_id,
    providerName: providers.get(data.support_provider_id) ?? "Support provider",
    email: data.email,
    fullName: data.full_name,
    inviterName: inviter?.full_name?.trim() || inviter?.email || null,
    message: data.message,
    expiresAt: data.expires_at,
  };
}
