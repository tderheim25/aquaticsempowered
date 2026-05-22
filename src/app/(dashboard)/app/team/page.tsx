import { Container, Stack, Typography } from "@mui/material";

import { TeamConsoleSection } from "@/components/team/TeamConsoleSection";
import { StatusToast, type StatusToastMessages } from "@/components/ui/StatusToast";
import { requireOrg, requireRole } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Team | Aquatics Empowered",
};

const TEAM_TOAST_MESSAGES: StatusToastMessages = {
  updated: { severity: "success", text: "Member updated." },
  invited: {
    severity: "success",
    text: "Invitation sent. Once they create their account, they'll join your org automatically.",
  },
  "invited-existing": {
    severity: "success",
    text: "Invitation sent. They'll see it in their notifications to accept.",
  },
  added: { severity: "success", text: "User added to your organization." },
  removed: { severity: "success", text: "Member removed from your organization." },
  invalid: { severity: "error", text: "Invalid request." },
  error: { severity: "error", text: "Could not save changes." },
  self: { severity: "error", text: "You can't demote your own account." },
  "already-member": { severity: "info", text: "That user is already part of your team." },
  "already-resolved": { severity: "info", text: "That invitation has already been resolved." },
  "email-taken": { severity: "error", text: "That email belongs to another organization." },
  "invite-failed": { severity: "error", text: "We couldn't save the invite. Check the email and try again." },
  "invite-email-failed": {
    severity: "error",
    text: "Invite was saved but the email could not be sent. Verify your sender domain in Resend, then use Resend on the pending invite.",
  },
  "invite-email-not-configured": {
    severity: "warning",
    text: "Invite was saved but email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL).",
  },
  "invite-cancelled": { severity: "info", text: "Invitation cancelled." },
  "invite-resent": { severity: "success", text: "Invitation resent." },
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await requireRole("org_admin");
  await requireOrg();
  const { status } = await searchParams;

  const supabase = await createClient();
  const admin = createAdminClient();
  const [membersRes, orgRes, invitesRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("org_id", profile.org_id!)
      .order("created_at", { ascending: false }),
    supabase.from("organizations").select("name").eq("id", profile.org_id!).maybeSingle(),
    admin
      .from("org_invitations")
      .select("id, email, full_name, role, status, created_at, expires_at, invited_user_id")
      .eq("org_id", profile.org_id!)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <Container maxWidth="lg">
      <StatusToast status={status} messages={TEAM_TOAST_MESSAGES} />
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
            Team
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users in your organization only. Platform administration is separate.
          </Typography>
        </Stack>

        <TeamConsoleSection
          members={membersRes.data ?? []}
          currentUserId={profile.id}
          orgName={orgRes.data?.name ?? null}
          pendingInvitations={(invitesRes.data ?? []).map((inv) => ({
            id: inv.id,
            email: inv.email,
            full_name: inv.full_name,
            role: inv.role,
            created_at: inv.created_at,
            expires_at: inv.expires_at,
            kind: inv.invited_user_id ? "existing" : "new",
          }))}
        />
      </Stack>
    </Container>
  );
}
