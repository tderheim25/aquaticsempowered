import { Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export const metadata = {
  title: "Forgot access | Aquatics Empowered",
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/app";

  return (
    <AuthLayout
      title="Forgot access"
      subtitle="If you already have an account, we’ll email you a secure access link."
    >
      <MagicLinkForm mode="forgot" nextPath={nextPath} />
      <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
        <Link href="/login" style={{ fontWeight: 600 }}>
          Back to sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}
