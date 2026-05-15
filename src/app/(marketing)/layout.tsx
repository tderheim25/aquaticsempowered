import { Box } from "@mui/material";
import { Suspense } from "react";

import { AdBanner } from "@/components/marketing/AdBanner";
import { MarketingPostHog } from "@/components/marketing/MarketingPostHog";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5 }}>
        <AdBanner variant="compact" />
      </Box>
      <SiteHeader />
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
