import { Stack, Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export const metadata = {
  title: "Sign in | Aquatics Empowered",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/app";

  return (
    <AuthLayout title="Sign in" subtitle="We’ll email you a secure link — no password to remember.">
      <MagicLinkForm mode="login" nextPath={nextPath} />
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
