"use client";

import WavesRoundedIcon from "@mui/icons-material/WavesRounded";
import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { COMMUNITY_BRAND_GRADIENT } from "@/components/community/communityUi";

export type BrandMarkProps = {
  href?: string;
  /** Defaults to “Aquatics Empowered home”. */
  ariaLabel?: string;
};

/** Logo mark + wordmark (matches marketing SiteHeader). */
export function BrandMark({ href = "/", ariaLabel = "Aquatics Empowered home" }: BrandMarkProps) {
  return (
    <Box
      component={Link}
      href={href}
      aria-label={ariaLabel}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.25,
        textDecoration: "none",
        color: "inherit",
        flexShrink: 0,
        minWidth: 0,
        "&:hover .brand-mark": {
          transform: "translateY(-1px) rotate(-6deg)",
        },
      }}
    >
      <Box
        className="brand-mark"
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          color: "common.white",
          background: COMMUNITY_BRAND_GRADIENT,
          boxShadow: "0 6px 16px -6px rgba(0, 59, 111, 0.55)",
          transition: "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          flexShrink: 0,
        }}
      >
        <WavesRoundedIcon sx={{ fontSize: 22 }} />
      </Box>
      <Stack spacing={0.1} sx={{ display: { xs: "none", sm: "flex" }, minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
            lineHeight: 1,
            color: "text.primary",
            letterSpacing: "-0.01em",
          }}
        >
          Aquatics Empowered
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: "0.68rem",
            color: "text.secondary",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Operate · Protect · Grow
        </Typography>
      </Stack>
      <Typography
        component="span"
        sx={{
          display: { xs: "block", sm: "none" },
          fontWeight: 800,
          fontSize: "1rem",
          color: "text.primary",
          letterSpacing: "-0.01em",
        }}
      >
        Aquatics
      </Typography>
    </Box>
  );
}
