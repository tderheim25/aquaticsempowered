import { Typography } from "@mui/material";
import Link from "next/link";

import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata = {
  title: "Check your email | Aquatics Empowered",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthLayout title="Check your email" subtitle="We sent a secure sign-in link. It may take a minute to arrive.">
      {email ? (
        <Typography variant="body2" color="text.secondary">
          Sent to <strong>{decodeURIComponent(email)}</strong>
        </Typography>
      ) : null}
      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link href="/login" style={{ fontWeight: 600 }}>
          Use a different email
        </Link>
      </Typography>
    </AuthLayout>
  );
}
