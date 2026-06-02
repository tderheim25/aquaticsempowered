"use client";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import {
  CommunityNotificationsBell,
  CommunityUnreadBadge,
  isCommunityRoute,
} from "@/components/community/CommunityNotificationsBell";
import { BreadcrumbLabelProvider } from "@/components/dashboard/BreadcrumbLabelContext";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import {
  SIDEBAR_DRAWER_COLLAPSED,
  SIDEBAR_DRAWER_WIDTH,
  sidebarAppBarSx,
  sidebarDrawerPaperSx,
  sidebarShellBackgroundSx,
} from "@/components/navigation/sidebarStyles";
import { AccountSubscriptionMenuSection } from "@/components/dashboard/AccountSubscriptionMenuSection";
import {
  OrgInvitationsMenuItems,
  useOrgInvitations,
} from "@/components/team/OrgInvitationsBell";
import type { AppViewKey } from "@/lib/auth/viewPermissions";
import type { OrgOption } from "@/lib/auth/activeOrgShared";
import type { OrgSubscriptionSummary } from "@/lib/billing/subscriptionSummary";
import type { UserRole } from "@/types/database";

export function DashboardShell({
  displayName,
  avatarUrl,
  accountSettingsHref,
  communityProfileHref,
  orgName,
  planLabel,
  subscriptionSummary,
  userRole,
  allowedViews,
  hasOrg,
  superAdminOrgOptions,
  superAdminActiveOrgId,
  children,
}: {
  displayName: string;
  avatarUrl?: string | null;
  accountSettingsHref?: string | null;
  communityProfileHref?: string | null;
  orgName: string | null;
  planLabel: string;
  subscriptionSummary?: OrgSubscriptionSummary | null;
  userRole: UserRole | null;
  allowedViews: AppViewKey[];
  hasOrg: boolean;
  superAdminOrgOptions?: OrgOption[];
  superAdminActiveOrgId?: string | null;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const { invitations, refresh: refreshInvitations } = useOrgInvitations(true);
  const invitationCount = invitations.length;

  const drawerWidth = collapsed ? SIDEBAR_DRAWER_COLLAPSED : SIDEBAR_DRAWER_WIDTH;
  const communityContext = isCommunityRoute(pathname);
  const headerInitial = displayName?.trim().charAt(0)?.toUpperCase() ?? "U";

  const sidebar = (
    <DashboardNav
      allowedViews={allowedViews}
      hasOrg={hasOrg}
      superAdminOrgOptions={superAdminOrgOptions}
      superAdminActiveOrgId={superAdminActiveOrgId}
      userRole={userRole}
      collapsed={collapsed && mdUp}
      onToggleCollapse={mdUp ? () => setCollapsed((c) => !c) : undefined}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  const openAccountMenu = (el: HTMLElement) => setAnchorEl(el);

  return (
    <Box sx={sidebarShellBackgroundSx}>
      <AppBar position="fixed" elevation={0} sx={sidebarAppBarSx}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
          {!mdUp ? (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuRoundedIcon />
            </IconButton>
          ) : null}
          {communityContext ? (
            <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
              <BrandMark href="/community" ariaLabel="Community home" />
            </Box>
          ) : (
            <Typography
              variant="h6"
              component={Link}
              href="/app"
              sx={{
                flexGrow: 1,
                minWidth: 0,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "primary.main",
                textDecoration: "none",
              }}
            >
              Aquatics Empowered
            </Typography>
          )}
          <Chip
            label={planLabel}
            size="small"
            sx={{
              display: { xs: "none", sm: communityContext ? "none" : "flex" },
              borderRadius: 2,
              fontWeight: 600,
            }}
          />
          {communityContext ? <CommunityNotificationsBell enabled /> : null}
          <IconButton
            onClick={(e) => openAccountMenu(e.currentTarget)}
            size="small"
            aria-label={
              invitationCount > 0
                ? `Account menu, ${invitationCount} organization invitation${invitationCount === 1 ? "" : "s"}`
                : "Account menu"
            }
            sx={{ position: "relative", p: communityContext ? 0.25 : undefined }}
          >
            <CommunityAvatar
              src={avatarUrl}
              initials={headerInitial}
              size={communityContext ? 36 : 32}
            />
            <CommunityUnreadBadge count={invitationCount} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{ paper: { sx: { minWidth: 280 } } }}
          >
            <OrgInvitationsMenuItems
              invitations={invitations}
              onResolve={() => {
                setAnchorEl(null);
                void refreshInvitations();
              }}
            />
            <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: 1 }}>
              <Typography variant="subtitle2">{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {userRole === "super_admin" && !orgName
                  ? "Super admin · select org in sidebar"
                  : (orgName ?? "No organization linked")}
              </Typography>
            </MenuItem>
            {subscriptionSummary ? (
              <AccountSubscriptionMenuSection
                summary={subscriptionSummary}
                onNavigate={() => setAnchorEl(null)}
              />
            ) : (
              <Divider />
            )}
            {accountSettingsHref ? (
              <MenuItem component={Link} href={accountSettingsHref} onClick={() => setAnchorEl(null)}>
                Account settings
              </MenuItem>
            ) : null}
            {communityProfileHref ? (
              <MenuItem component={Link} href={communityProfileHref} onClick={() => setAnchorEl(null)}>
                Community profile
              </MenuItem>
            ) : null}
            <MenuItem component={Link} href="/" onClick={() => setAnchorEl(null)}>
              Visit website
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={async () => {
                setAnchorEl(null);
                await signOut();
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
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
        <BreadcrumbLabelProvider>
          <DashboardBreadcrumbs />
          {children}
        </BreadcrumbLabelProvider>
      </Box>
    </Box>
  );
}
