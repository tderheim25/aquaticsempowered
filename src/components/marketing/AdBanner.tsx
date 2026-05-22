import { Box, Link as MuiLink, Typography } from "@mui/material";
import Image from "next/image";

import type { AdPlacementRow } from "@/lib/marketing/adPlacementTypes";

type AdBannerVariant = "leaderboard" | "inline" | "compact";

const height: Record<AdBannerVariant, number> = {
  leaderboard: 72,
  inline: 56,
  compact: 44,
};

/**
 * Advertising surface — pass `placement` from loadActiveAdPlacement or shows default reserve copy.
 */
export function AdBanner({
  variant = "inline",
  label = "Advertisement",
  placement = null,
}: {
  variant?: AdBannerVariant;
  label?: string;
  placement?: AdPlacementRow | null;
}) {
  if (placement?.image_url || placement?.target_url) {
    const inner = (
      <Box
        sx={{
          minHeight: height[variant],
          position: "relative",
          borderRadius: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {placement.image_url ? (
          <Image src={placement.image_url} alt={placement.title || label} fill style={{ objectFit: "cover" }} />
        ) : (
          <Typography variant="body2" sx={{ px: 2 }}>
            {placement.title}
          </Typography>
        )}
      </Box>
    );
    return placement.target_url ? (
      <MuiLink href={placement.target_url} target="_blank" rel="noopener sponsored" sx={{ display: "block", textDecoration: "none" }}>
        {inner}
      </MuiLink>
    ) : (
      inner
    );
  }

  return (
    <Box
      role="complementary"
      aria-label={label}
      sx={{
        minHeight: height[variant],
        px: 2,
        py: variant === "compact" ? 0.75 : 1.25,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        bgcolor: "action.hover",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Sponsor placement — contact hello@aquaticsempowered.com for availability.
      </Typography>
    </Box>
  );
}
