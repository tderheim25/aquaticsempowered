"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

export function VendorPendingPageShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ maxWidth: 560, mx: "auto", py: { xs: 3, md: 5 }, px: 2 }}>{children}</Box>
  );
}
