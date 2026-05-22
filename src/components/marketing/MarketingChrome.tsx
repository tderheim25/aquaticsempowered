"use client";

import { Box } from "@mui/material";
import { Suspense, type ReactNode } from "react";

import { MarketingPostHog } from "@/components/marketing/MarketingPostHog";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader, type MarketingHeaderUser } from "@/components/marketing/SiteHeader";

export function MarketingChrome({
  headerUser,
  children,
}: {
  headerUser: MarketingHeaderUser | null;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader user={headerUser} />
      <Suspense fallback={null}>
        <MarketingPostHog />
      </Suspense>
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
