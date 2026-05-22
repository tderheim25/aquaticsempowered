import type { SxProps, Theme } from "@mui/material";

/** Brand tokens aligned with marketing SiteHeader (Aquatics Empowered). */
export const BRAND_NAVY = "#003B6F";
/** rgba(0, 59, 111, α) — static tints safe for Server Components (no theme callbacks in sx). */
export const BRAND_NAVY_TINT_02 = "rgba(0, 59, 111, 0.02)";
export const BRAND_NAVY_TINT_04 = "rgba(0, 59, 111, 0.04)";
export const BRAND_NAVY_MID = "#0a4d8c";
export const BRAND_TEAL = "#2EA5A0";

export const COMMUNITY_BRAND_GRADIENT =
  `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_NAVY_MID} 50%, ${BRAND_TEAL} 100%)`;

export const COMMUNITY_TAB_INDICATOR_GRADIENT =
  `linear-gradient(90deg, ${BRAND_NAVY} 0%, ${BRAND_TEAL} 100%)`;

export const COMMUNITY_ACCENT_BAR_GRADIENT = COMMUNITY_TAB_INDICATOR_GRADIENT;

/** Page wrapper — light brand tint like the marketing header band. */
export const communityPageContainerSx: SxProps<Theme> = {
  width: "100%",
  maxWidth: "100%",
  px: { xs: 2, sm: 3, md: 4 },
  pt: { xs: 1, sm: 2 },
  pb: { xs: 10, md: 4 },
  bgcolor: BRAND_NAVY_TINT_02,
};

/** Inside dashboard main (offset shell padding, keep brand band). */
export const communityPageContainerEmbeddedSx: SxProps<Theme> = {
  width: "100%",
  maxWidth: "100%",
  mx: { xs: -2, sm: -3, lg: -4 },
  px: { xs: 2, sm: 3, lg: 4 },
  pt: { xs: 0.5, sm: 1 },
  pb: { xs: 6, md: 3 },
  bgcolor: BRAND_NAVY_TINT_02,
};

/** Primary page title (matches “Aquatics Empowered” weight). */
export const communityPageTitleSx: SxProps<Theme> = {
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "text.primary",
  lineHeight: 1.15,
};

/** Subtitle under page title. */
export const communityPageSubtitleSx: SxProps<Theme> = {
  color: "text.secondary",
  lineHeight: 1.5,
};

/** Eyebrow / tagline (matches “OPERATE · PROTECT · GROW”). */
export function communityEyebrowSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "text.secondary",
    mb: 0.75,
    ...extra,
  };
}

/** Section headings inside cards (Create a post, Feed, etc.). */
export const communitySectionTitleSx: SxProps<Theme> = {
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: "text.primary",
};

/** Card surfaces used on Community feed and profile. */
export function communitySurfacePaperSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return {
    p: 2,
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: "0 4px 24px -12px rgba(15, 23, 42, 0.08)",
    ...extra,
  };
}

/** Header avatar — circular gradient, white letter, white ring, soft shadow. */
export function communityAvatarSx(size = 72): SxProps<Theme> {
  const fontSize = size >= 72 ? "1.5rem" : size >= 40 ? "0.875rem" : "0.75rem";
  return {
    width: size,
    height: size,
    fontSize,
    background: COMMUNITY_BRAND_GRADIENT,
    color: "common.white",
    fontWeight: 700,
    border: "2px solid",
    borderColor: "background.paper",
    boxShadow: "0 4px 12px -6px rgba(0, 59, 111, 0.45)",
  };
}

export function communityContainedButtonSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return {
    fontWeight: 700,
    textTransform: "none",
    borderRadius: 2,
    background: COMMUNITY_BRAND_GRADIENT,
    boxShadow: "0 6px 16px -8px rgba(0, 59, 111, 0.45)",
    "&:hover": {
      background: `linear-gradient(135deg, ${BRAND_NAVY_MID} 0%, #0d6394 50%, #36b8b2 100%)`,
      boxShadow: "0 8px 20px -8px rgba(0, 59, 111, 0.55)",
    },
    ...extra,
  };
}

export function communityOutlinedButtonSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return {
    fontWeight: 600,
    textTransform: "none",
    borderRadius: 2,
    borderColor: "divider",
    color: "text.primary",
    bgcolor: "background.paper",
    "&:hover": {
      borderColor: BRAND_TEAL,
      bgcolor: BRAND_NAVY_TINT_04,
    },
    ...extra,
  };
}

/** Updates / Jobs tab pills (matches header nav active state). */
export function communityFeedTabButtonSx(active: boolean): SxProps<Theme> {
  return active ? communityContainedButtonSx({ px: 2 }) : communityOutlinedButtonSx({ px: 2 });
}

export const communityTabsSx: SxProps<Theme> = {
  minHeight: 44,
  borderBottom: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  "& .MuiTab-root": {
    fontWeight: 600,
    textTransform: "none",
    minHeight: 44,
    fontSize: "0.9375rem",
    color: "text.secondary",
  },
  "& .Mui-selected": {
    color: BRAND_NAVY,
    fontWeight: 700,
  },
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: 2,
    background: COMMUNITY_TAB_INDICATOR_GRADIENT,
  },
};

/** Search field — rounded, subtle border like marketing inputs. */
export const communitySearchFieldSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "background.paper",
    "& fieldset": {
      borderColor: "divider",
    },
    "&:hover fieldset": {
      borderColor: BRAND_TEAL,
    },
    "&.Mui-focused fieldset": {
      borderColor: BRAND_NAVY,
      borderWidth: 1,
    },
  },
};
