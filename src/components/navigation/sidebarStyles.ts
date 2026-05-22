import { alpha, type Theme } from "@mui/material/styles";

import { softUiTokens } from "@/theme/softUiTokens";

export const SIDEBAR_DRAWER_WIDTH = 268;
export const SIDEBAR_DRAWER_COLLAPSED = 76;

export const sidebarDrawerPaperSx = {
  boxSizing: "border-box",
  borderRight: "1px solid rgba(15, 35, 54, 0.06)",
  bgcolor: alpha("#FFFFFF", 0.82),
  backdropFilter: "blur(10px)",
  backgroundImage: (t: Theme) =>
    t.palette.mode === "light"
      ? `linear-gradient(180deg, ${alpha(softUiTokens.accent.aqua.ring, 0.06)} 0%, transparent 32%)`
      : "none",
  transition: (t: Theme) =>
    t.transitions.create("width", {
      easing: t.transitions.easing.sharp,
      duration: t.transitions.duration.enteringScreen,
    }),
  overflowX: "hidden",
};

export const sidebarNavItemSx = {
  mx: 1,
  mb: 0.35,
  borderRadius: 2,
  minHeight: 44,
  transition: (theme: { transitions: { create: (p: string[], o?: object) => string } }) =>
    theme.transitions.create(["background-color", "padding", "transform"], { duration: 200 }),
  "&:hover": {
    transform: "translateX(2px)",
  },
  "&.Mui-selected": {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    boxShadow: "0 4px 14px rgba(0, 59, 111, 0.35)",
    "&:hover": {
      bgcolor: "primary.dark",
      transform: "translateX(0)",
    },
    "& .MuiListItemIcon-root": {
      color: "inherit",
    },
    "& .MuiTypography-root": {
      color: "inherit",
    },
  },
};

export const sidebarShellBackgroundSx = {
  display: "flex",
  minHeight: "100vh",
  bgcolor: softUiTokens.background.gradientStart,
  backgroundImage: `${softUiTokens.background.gradient}, radial-gradient(ellipse 70% 40% at 80% -10%, ${alpha(
    softUiTokens.accent.coral.ring,
    0.08,
  )}, transparent 60%), radial-gradient(ellipse 60% 40% at 15% 0%, ${alpha(
    softUiTokens.accent.aqua.ring,
    0.07,
  )}, transparent 55%)`,
  backgroundAttachment: "fixed",
};

export const sidebarAppBarSx = {
  zIndex: (t: Theme) => t.zIndex.drawer + 1,
  bgcolor: alpha("#FFFFFF", 0.78),
  backdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(15, 35, 54, 0.06)",
  color: softUiTokens.text.primary,
};

export const sidebarGroupHeaderSx = {
  px: 2.5,
  py: 0.75,
  display: "block",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "text.secondary",
  opacity: 0.85,
} as const;
