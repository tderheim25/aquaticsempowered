"use client";

import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";
import { SUPPORT_TECHNICIAN_ROLE_LABEL } from "@/lib/supportTechnicianInvitations";

export type SignupOrgInviteBanner = {
  orgName: string;
  roleLabel: string;
  inviterName: string | null;
  message: string | null;
};

export type SignupTechInviteBanner = {
  providerName: string;
  inviterName: string | null;
  message: string | null;
};

export function SignupPageContent({
  nextPath,
  inviteToken,
  inviteEmail,
  inviteFullName,
  inviteExpired,
  orgInvite,
  techInvite,
  signInHref,
}: {
  nextPath: string;
  inviteToken?: string;
  inviteEmail?: string;
  inviteFullName?: string;
  inviteExpired: boolean;
  orgInvite: SignupOrgInviteBanner | null;
  techInvite: SignupTechInviteBanner | null;
  signInHref: string;
}) {
  return (
    <Stack spacing={2.5}>
      {orgInvite ? (
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
                {orgInvite.inviterName ? (
                  <Typography variant="caption" color="text.secondary">
                    Invited by {orgInvite.inviterName}
                  </Typography>
                ) : null}
              </Stack>
              {orgInvite.message ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  &ldquo;{orgInvite.message}&rdquo;
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {techInvite ? (
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
                {techInvite.inviterName ? (
                  <Typography variant="caption" color="text.secondary">
                    Invited by {techInvite.inviterName}
                  </Typography>
                ) : null}
              </Stack>
              {techInvite.message ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  &ldquo;{techInvite.message}&rdquo;
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {inviteExpired ? (
        <Alert severity="warning">
          This invitation link is no longer valid. It may have expired or been cancelled. Ask the admin
          who invited you to send a fresh one.
        </Alert>
      ) : null}

      <EmailPasswordForm
        mode="signup"
        nextPath={nextPath}
        inviteToken={inviteToken}
        lockedEmail={inviteEmail}
        defaultFullName={inviteFullName}
      />

      <Typography variant="body2" sx={{ textAlign: "center" }}>
        Already have access?{" "}
        <Link href={signInHref} style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </Typography>
    </Stack>
  );
}
