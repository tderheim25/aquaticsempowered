import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export const ORG_INVITATION_ROLES: UserRole[] = ["org_admin", "manager", "staff"];

export const ORG_ROLE_LABELS: Record<string, string> = {
  org_admin: "Org Admin",
  manager: "Manager",
  staff: "Staff",
};

export function isOrgRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ORG_INVITATION_ROLES as string[]).includes(value);
}

export function generateInviteToken() {
  return randomBytes(24).toString("base64url");
}

export function buildInviteSignupUrl(baseUrl: string, token: string) {
  const url = new URL("/signup", baseUrl);
  url.searchParams.set("invite", token);
  return url.toString();
}

export function buildAppUrl(baseUrl: string) {
  const url = new URL("/app", baseUrl);
  return url.toString();
}

/** Best-effort base URL resolver: env override → request origin → relative. */
export function resolveBaseUrl(requestOrigin?: string | null) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    null;
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function isInviteExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export type PendingInvitationItem = {
  id: string;
  orgId: string;
  orgName: string;
  role: string;
  roleLabel: string;
  inviterName: string | null;
  message: string | null;
  createdAt: string;
  expiresAt: string;
};

type InvitationListRow = {
  id: string;
  org_id: string;
  role: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  invited_by: string | null;
  status: string;
  organizations: { name: string | null } | null;
  inviter: { full_name: string | null; email: string | null } | null;
};

type InvitationDetailRow = InvitationListRow & {
  email: string;
  full_name: string | null;
};

async function lookupNames(
  admin: ReturnType<typeof createAdminClient>,
  orgIds: string[],
  inviterIds: string[],
) {
  const [orgsRes, usersRes] = await Promise.all([
    orgIds.length
      ? admin.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[], error: null }),
    inviterIds.length
      ? admin.from("users").select("id, full_name, email").in("id", inviterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[], error: null }),
  ]);
  const orgs = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name]));
  const users = new Map((usersRes.data ?? []).map((u) => [u.id, { full_name: u.full_name, email: u.email }]));
  return { orgs, users };
}

/**
 * Pending invitations addressed to the given email. Uses the admin client so we
 * can resolve organization + inviter names without RLS friction.
 */
export async function loadPendingInvitationsForEmail(email: string): Promise<PendingInvitationItem[]> {
  if (!email) return [];
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("org_invitations")
    .select("id, org_id, role, message, created_at, expires_at, invited_by, status")
    .ilike("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const fresh = data.filter((row) => !isInviteExpired(row.expires_at));
  const { orgs, users } = await lookupNames(
    admin,
    Array.from(new Set(fresh.map((r) => r.org_id))),
    Array.from(new Set(fresh.map((r) => r.invited_by).filter((v): v is string => Boolean(v)))),
  );

  return fresh.map((row) => {
    const inviter = row.invited_by ? users.get(row.invited_by) : null;
    return {
      id: row.id,
      orgId: row.org_id,
      orgName: orgs.get(row.org_id) ?? "An organization",
      role: row.role,
      roleLabel: ORG_ROLE_LABELS[row.role] ?? row.role,
      inviterName: inviter?.full_name?.trim() || inviter?.email || null,
      message: row.message,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  });
}

/** Look up a single pending invitation by token — used by the signup page. */
export async function loadInvitationByToken(token: string) {
  if (!token) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("org_invitations")
    .select("id, org_id, email, full_name, role, message, status, expires_at, invited_by")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status !== "pending") return null;
  if (isInviteExpired(data.expires_at)) return null;

  const { orgs, users } = await lookupNames(admin, [data.org_id], data.invited_by ? [data.invited_by] : []);
  const inviter = data.invited_by ? users.get(data.invited_by) : null;

  return {
    id: data.id,
    orgId: data.org_id,
    orgName: orgs.get(data.org_id) ?? "An organization",
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    roleLabel: ORG_ROLE_LABELS[data.role] ?? data.role,
    inviterName: inviter?.full_name?.trim() || inviter?.email || null,
    message: data.message,
    expiresAt: data.expires_at,
  };
}

// Helper types are exported for callers who want them.
export type { InvitationListRow, InvitationDetailRow };
