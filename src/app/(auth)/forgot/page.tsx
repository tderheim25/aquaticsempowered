import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPageContent } from "@/components/auth/ForgotPageContent";

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
      <ForgotPageContent nextPath={nextPath} />
    </AuthLayout>
  );
}
