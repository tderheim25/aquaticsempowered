import type { ReactNode } from "react";
import { Suspense } from "react";

import CommunityDmDock from "@/components/community/CommunityDmDock";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  await requireViewAccess("community");
  await requireProfileForApp();

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <CommunityDmDock />
      </Suspense>
    </>
  );
}
