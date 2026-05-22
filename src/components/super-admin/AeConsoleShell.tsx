"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { Suspense, useState } from "react";

import { AeConsoleNav, type AeConsoleNavBadges } from "@/components/super-admin/AeConsoleNav";
import {
  SIDEBAR_DRAWER_COLLAPSED,
  SIDEBAR_DRAWER_WIDTH,
  sidebarAppBarSx,
  sidebarDrawerPaperSx,
  sidebarShellBackgroundSx,
} from "@/components/navigation/sidebarStyles";

export function AeConsoleShell({
  badges,
  children,
}: {
  badges: AeConsoleNavBadges;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const drawerWidth = collapsed ? SIDEBAR_DRAWER_COLLAPSED : SIDEBAR_DRAWER_WIDTH;

  const sidebar = (
    <Suspense fallback={<Box sx={{ flex: 1, minHeight: 120 }} />}>
      <AeConsoleNav
        badges={badges}
        collapsed={collapsed && mdUp}
        onToggleCollapse={mdUp ? () => setCollapsed((c) => !c) : undefined}
        onNavigate={() => setMobileOpen(false)}
      />
    </Suspense>
  );

  return (
    <Box sx={sidebarShellBackgroundSx}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={sidebarAppBarSx}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
          {!mdUp ? (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuRoundedIcon />
            </IconButton>
          ) : null}
          <ShieldOutlinedIcon color="primary" sx={{ display: { xs: "none", sm: "block" } }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              AE Console
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              Aquatics Empowered platform administration
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/app"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              borderRadius: 2,
              px: 1.5,
              transition: (t) => t.transitions.create(["background-color", "transform"]),
              "&:hover": { transform: "translateX(-2px)" },
            }}
          >
            Back to app
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" } }}
          PaperProps={{ sx: { ...sidebarDrawerPaperSx, width: SIDEBAR_DRAWER_WIDTH } }}
        >
          <Toolbar />
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { ...sidebarDrawerPaperSx, width: drawerWidth },
          }}
          open
        >
          <Toolbar />
          {sidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          mt: { xs: 7, md: 8 },
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2.5, md: 3.5 },
          pb: 6,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
