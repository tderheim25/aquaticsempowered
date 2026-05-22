"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

import { communityPageContainerEmbeddedSx, communityPageContainerSx } from "./communityUi";

/** Client wrapper so page chrome uses the same Emotion cache as other MUI client UI. */
export function CommunityPageContainer({
  children,
  embedded = false,
}: {
  children: ReactNode;
  /** When true, fills dashboard main with brand tint (negates shell horizontal padding). */
  embedded?: boolean;
}) {
  return <Box sx={embedded ? communityPageContainerEmbeddedSx : communityPageContainerSx}>{children}</Box>;
}
