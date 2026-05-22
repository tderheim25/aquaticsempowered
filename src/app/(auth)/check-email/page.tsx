import { AuthLayout } from "@/components/auth/AuthLayout";
import { CheckEmailPageContent } from "@/components/auth/CheckEmailPageContent";

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
    <AuthLayout title="Check your email" subtitle="We sent a secure email link. It may take a minute to arrive.">
      <CheckEmailPageContent email={email ? decodeURIComponent(email) : undefined} />
    </AuthLayout>
  );
}
