import { Alert, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

export const metadata = {
  title: "Sign in | Aquatics Empowered",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; registered?: string }>;
}) {
  const { next, error, registered } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/app";
  const showAuthError = error === "auth";
  const showRegistered = registered === "1";

  return (
    <AuthLayout title="Sign in" subtitle="Use your email and password to access your account.">
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
    </AuthLayout>
  );
}
