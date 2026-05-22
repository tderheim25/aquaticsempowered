import { Suspense } from "react";

import { AeConsoleShell } from "@/components/super-admin/AeConsoleShell";
import { requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { loadAeConsoleNavBadges } from "@/lib/auth/loadAeConsoleNavBadges";

export const metadata = {
  title: "AE Console | Aquatics Empowered",
  robots: { index: false, follow: false },
};

export default async function AeConsoleLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdminConsole();
  const badges = await loadAeConsoleNavBadges();

  return (
    <AeConsoleShell badges={badges}>
      <Suspense fallback={null}>{children}</Suspense>
    </AeConsoleShell>
  );
}
