import { Box, Typography } from "@mui/material";

type AdBannerVariant = "leaderboard" | "inline" | "compact";

const height: Record<AdBannerVariant, number> = {
  leaderboard: 72,
  inline: 56,
  compact: 44,
};

/**
 * Reserved advertising surface for sponsors. Replace inner content with your ad network
 * or managed placements when inventory is live.
 */
export function AdBanner({ variant = "inline", label = "Advertisement" }: { variant?: AdBannerVariant; label?: string }) {
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
