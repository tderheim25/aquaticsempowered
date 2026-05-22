import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginPageContent } from "@/components/auth/LoginPageContent";

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
      <LoginPageContent
        nextPath={nextPath}
        showAuthError={showAuthError}
        showRegistered={showRegistered}
      />
    </AuthLayout>
  );
}
