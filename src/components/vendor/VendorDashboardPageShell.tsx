"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

export function VendorDashboardPageShell({
  vendorName,
  tagline,
  category,
  listingVisible,
  publicProfileHref,
  websiteUrl,
  children,
}: {
  vendorName: string;
  tagline: string | null;
  category: string | null;
  listingVisible: boolean;
  publicProfileHref: string | null;
  websiteUrl: string | null;
  children: ReactNode;
}) {
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
              Vendor portal
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              {vendorName}
            </Typography>
            {tagline ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {tagline}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              {category ? <Chip size="small" label={category} variant="outlined" /> : null}
              <Chip
                size="small"
                label={listingVisible ? "Listed on marketplace" : "Listing hidden"}
                color={listingVisible ? "success" : "default"}
                variant="outlined"
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {publicProfileHref ? (
              <Button component={Link} href={publicProfileHref} variant="outlined" size="small">
                View public profile
              </Button>
            ) : null}
            {websiteUrl ? (
              <Button
                component="a"
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="text"
                size="small"
              >
                Your website
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Suspense fallback={null}>{children}</Suspense>
      </Stack>
    </Box>
  );
}
