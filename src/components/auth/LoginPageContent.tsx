"use client";

import { Alert, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

export function LoginPageContent({
  nextPath,
  showAuthError,
  showRegistered,
}: {
  nextPath: string;
  showAuthError: boolean;
  showRegistered: boolean;
}) {
  return (
    <>
      {showRegistered ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created. You can sign in now.
        </Alert>
      ) : null}
      {showAuthError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          We couldn&apos;t complete authentication. Please sign in again.
        </Alert>
      ) : null}
      <EmailPasswordForm mode="login" nextPath={nextPath} />
      <Stack spacing={1} sx={{ mt: 2 }} alignItems="center">
        <Typography variant="body2">
          New here?{" "}
          <Link href="/signup" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </Typography>
        <Typography variant="body2">
          <Link href="/forgot" style={{ color: "inherit" }}>
            Forgot access?
          </Link>
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mt: 2.5, lineHeight: 1.5 }}
      >
        By signing in, you agree to our{" "}
        <Link href="/terms" style={{ fontWeight: 600 }}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" style={{ fontWeight: 600 }}>
          Privacy Policy
        </Link>
        .
      </Typography>
    </>
  );
}
