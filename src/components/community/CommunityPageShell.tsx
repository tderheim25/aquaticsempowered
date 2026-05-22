"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Button, Stack } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import { CommunityPageContainer } from "./CommunityPageContainer";

export { CommunityPageContainer } from "./CommunityPageContainer";
import { CommunityPageHeader } from "./CommunityPageHeader";
import { CommunitySpotlightRail, type CommunityVendorSpotlight } from "./CommunitySpotlightRail";

export type CommunityPageShellProps = {
  title: string;
  subtitle?: string;
  /** Uppercase tagline above title (brand “OPERATE · PROTECT · GROW” style). */
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  vendors: CommunityVendorSpotlight[];
  showSupportForm?: boolean;
  /** Use inside dashboard `/app/*` so brand background aligns with community feed. */
  embedded?: boolean;
  children: ReactNode;
};

export function CommunityPageShell({
  title,
  subtitle,
  eyebrow,
  backHref = "/community",
  backLabel = "Back to feed",
  vendors,
  showSupportForm = true,
  embedded = false,
  children,
}: CommunityPageShellProps) {
  return (
    <CommunityPageContainer embedded={embedded}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "flex-start", lg: "stretch" },
          gap: { xs: 2, lg: 3 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={2}>
            <Button
              component={Link}
              href={backHref}
              startIcon={<ArrowBackRoundedIcon />}
              variant="text"
              color="inherit"
              sx={{
                alignSelf: "flex-start",
                fontWeight: 600,
                color: "text.secondary",
                "&:hover": { color: "primary.main", bgcolor: "transparent" },
              }}
            >
              {backLabel}
            </Button>

            <CommunityPageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

            {children}
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: 320, xl: 360 },
            flexShrink: 0,
            alignSelf: { lg: "flex-start" },
            position: { lg: "sticky" },
            top: { lg: embedded ? 24 : 88 },
            maxHeight: { lg: embedded ? "calc(100vh - 120px)" : "calc(100vh - 104px)" },
            overflowY: { lg: "auto" },
            overflowX: "hidden",
            pb: { xs: 2, lg: 1 },
          }}
        >
          <CommunitySpotlightRail vendors={vendors} showSupportForm={showSupportForm} />
        </Box>
      </Box>
    </CommunityPageContainer>
  );
}
