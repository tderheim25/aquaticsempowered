"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

import {
  communityEyebrowSx,
  communityPageSubtitleSx,
  communityPageTitleSx,
} from "./communityUi";

export type CommunityPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CommunityPageHeader({ eyebrow, title, subtitle, action }: CommunityPageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "flex-end" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography component="span" sx={communityEyebrowSx()}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h4" sx={{ ...communityPageTitleSx, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body1" sx={communityPageSubtitleSx}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  );
}
