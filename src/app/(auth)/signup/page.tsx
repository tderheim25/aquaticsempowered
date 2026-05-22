import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";
import { loadInvitationByToken } from "@/lib/orgInvitations";
import {
  SUPPORT_TECHNICIAN_ROLE_LABEL,
  loadTechnicianInvitationByToken,
} from "@/lib/supportTechnicianInvitations";

export const metadata = {
  title: "Create account | Aquatics Empowered",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; invite?: string }>;
}) {
  const { next, invite: inviteToken } = await searchParams;

  const [orgInvite, techInvite] = inviteToken
    ? await Promise.all([
        loadInvitationByToken(inviteToken),
        loadTechnicianInvitationByToken(inviteToken),
      ])
    : [null, null];

  const invite = orgInvite ?? techInvite;
  const isTechnician = Boolean(techInvite && !orgInvite);
  const acceptNext = isTechnician ? "/portal/queue" : "/app";

  const nextPath = invite
    ? `/app/invitations/accept?token=${encodeURIComponent(inviteToken!)}&next=${encodeURIComponent(acceptNext)}`
    : next && next.startsWith("/")
      ? next
      : "/app";

  const inviteExpired = Boolean(inviteToken && !invite);

  const title = orgInvite
    ? `Join ${orgInvite.orgName}`
    : techInvite
      ? `Join ${techInvite.providerName}`
      : "Create account";
  const subtitle = orgInvite
    ? `Create your account to accept the invitation from ${orgInvite.inviterName ?? "your team"} as ${orgInvite.roleLabel}.`
    : techInvite
      ? `Create your account to work as a support technician for ${techInvite.providerName}.`
      : "Set up your account with email and password.";

  const inviteEmail = orgInvite?.email ?? techInvite?.email;
  const inviteFullName = orgInvite?.fullName ?? techInvite?.fullName ?? undefined;

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <Stack spacing={2.5}>
        {orgInvite && (
          <Box
            sx={(t) => ({
              borderRadius: 2,
              p: 2,
              border: 1,
              borderColor: "primary.light",
              background: `linear-gradient(135deg, ${t.palette.primary.main}0F 0%, ${t.palette.secondary.main}10 100%)`,
            })}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <BusinessRoundedIcon color="primary" />
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                  Invitation to {orgInvite.orgName}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Chip size="small" color="primary" label={orgInvite.roleLabel} />
                  {orgInvite.inviterName && (
                    <Typography variant="caption" color="text.secondary">
                      Invited by {orgInvite.inviterName}
                    </Typography>
                  )}
                </Stack>
                {orgInvite.message && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    &ldquo;{orgInvite.message}&rdquo;
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        {techInvite && (
          <Box
            sx={(t) => ({
              borderRadius: 2,
              p: 2,
              border: 1,
              borderColor: "secondary.light",
              background: `linear-gradient(135deg, ${t.palette.secondary.main}12 0%, ${t.palette.primary.main}0A 100%)`,
            })}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <BuildRoundedIcon color="secondary" />
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                  Support technician — {techInvite.providerName}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Chip size="small" color="secondary" label={SUPPORT_TECHNICIAN_ROLE_LABEL} />
                  {techInvite.inviterName && (
                    <Typography variant="caption" color="text.secondary">
                      Invited by {techInvite.inviterName}
                    </Typography>
                  )}
                </Stack>
                {techInvite.message && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    &ldquo;{techInvite.message}&rdquo;
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>
        )}

        {inviteExpired && (
          <Alert severity="warning">
            This invitation link is no longer valid. It may have expired or been cancelled. Ask the admin
            who invited you to send a fresh one.
          </Alert>
        )}

        <EmailPasswordForm
          mode="signup"
          nextPath={nextPath}
          inviteToken={invite ? inviteToken : undefined}
          lockedEmail={inviteEmail}
          defaultFullName={inviteFullName}
        />

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Already have access?{" "}
          <Link
            href={
              invite
                ? `/login?next=${encodeURIComponent(`/app/invitations/accept?token=${encodeURIComponent(inviteToken!)}&next=${encodeURIComponent(acceptNext)}`)}`
                : "/login"
            }
            style={{ fontWeight: 600 }}
          >
            Sign in
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
