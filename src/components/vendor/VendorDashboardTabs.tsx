"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function VendorDashboardTabs({
  inquiries,
  products,
}: {
  inquiries: ReactNode;
  products: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "products" ? 1 : 0;

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          router.replace(v === 1 ? "/app/vendor?tab=products" : "/app/vendor");
        }}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Inquiries" />
        <Tab label="Products" />
      </Tabs>
      {tab === 0 ? inquiries : products}
    </Box>
  );
}
