import { Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

export const metadata = {
  title: "Create account | Aquatics Empowered",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/app";

  return (
    <AuthLayout title="Create account" subtitle="Set up your account with email and password.">
      <EmailPasswordForm mode="signup" nextPath={nextPath} />
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        Already have access?{" "}
        <Link href="/login" style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}
