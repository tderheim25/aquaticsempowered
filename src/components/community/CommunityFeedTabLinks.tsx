"use client";

import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { communityFeedTabButtonSx } from "./communityUi";

export type CommunityFeedTab = "feed" | "jobs" | "marketplace";

export function CommunityFeedTabLinks({
  activeTab,
  jobCount = 0,
  marketplaceProductCount = 0,
}: {
  activeTab: CommunityFeedTab;
  jobCount?: number;
  marketplaceProductCount?: number;
}) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Button
        component={Link}
        href="/community"
        size="small"
        variant={activeTab === "feed" ? "contained" : "outlined"}
        sx={communityFeedTabButtonSx(activeTab === "feed")}
      >
        Updates
      </Button>
      <Button
        component={Link}
        href="/community?tab=jobs"
        size="small"
        variant={activeTab === "jobs" ? "contained" : "outlined"}
        sx={communityFeedTabButtonSx(activeTab === "jobs")}
      >
        Jobs
        {jobCount > 0 ? (
          <Typography component="span" variant="caption" sx={{ ml: 0.75, opacity: 0.95, fontWeight: 700 }}>
            ({jobCount})
          </Typography>
        ) : null}
      </Button>
      <Button
        component={Link}
        href="/community?tab=marketplace"
        size="small"
        variant={activeTab === "marketplace" ? "contained" : "outlined"}
        sx={communityFeedTabButtonSx(activeTab === "marketplace")}
      >
        Marketplace
        {marketplaceProductCount > 0 ? (
          <Typography component="span" variant="caption" sx={{ ml: 0.75, opacity: 0.95, fontWeight: 700 }}>
            ({marketplaceProductCount})
          </Typography>
        ) : null}
      </Button>
    </Stack>
  );
}
