import type { ReactNode } from "react";
import { Suspense } from "react";

import CommunityDmDock from "@/components/community/CommunityDmDock";

export default function MarketingCommunityLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <CommunityDmDock />
      </Suspense>
    </>
  );
}
