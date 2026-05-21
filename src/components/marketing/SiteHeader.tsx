"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";
import {
  CommunityActivityMenuItems,
  CommunityUnreadBadge,
  isCommunityRoute,
  markCommunityActivitySeen,
  useCommunityActivity,
} from "@/components/community/CommunityActivityBadge";
import { TrackedButton } from "@/components/marketing/TrackedButton";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
  { href: "/vendors", label: "Vendors" },
  { href: "/community", label: "Community" },
  { href: "/founders", label: "Founder Program" },
];

export type MarketingHeaderUser = {
  displayName: string;
  avatarUrl: string | null;
};

export function SiteHeader({ user }: { user?: MarketingHeaderUser | null }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const showCommunityActivity = Boolean(user && isCommunityRoute(pathname));
  const { activity, refresh: refreshActivity } = useCommunityActivity(showCommunityActivity);

  const initial = user?.displayName?.trim().charAt(0)?.toUpperCase() ?? "U";

  const openAccountMenu = (el: HTMLElement) => {
    setAnchorEl(el);
    if (showCommunityActivity && (activity?.total ?? 0) > 0) {
      void markCommunityActivitySeen().then(() => refreshActivity());
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Toolbar sx={{ gap: 2, py: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ fontWeight: 800, color: "primary.main", textDecoration: "none", flexGrow: 1 }}
          >
            Aquatics Empowered
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            {nav.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                color="inherit"
                sx={{ fontWeight: 600 }}
              >
                {item.label}
              </Button>
            ))}
            {user ? (
              <>
                <IconButton
                  onClick={(e) => openAccountMenu(e.currentTarget)}
                  size="small"
                  aria-label={
                    (activity?.total ?? 0) > 0
                      ? `Account menu, ${activity?.total} community notifications`
                      : "Account menu"
                  }
                  sx={{ position: "relative" }}
                >
                  <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
                    {initial}
                  </Avatar>
                  <CommunityUnreadBadge count={activity?.total ?? 0} />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                  <CommunityActivityMenuItems
                    activity={activity}
                    onNavigate={() => setAnchorEl(null)}
                  />
                  <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important" }}>
                    <Typography variant="subtitle2">{user.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Signed in
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem component={Link} href="/app" onClick={() => setAnchorEl(null)}>
                    Open portal
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setAnchorEl(null);
                      await signOut();
                    }}
                  >
                    Sign out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button component={Link} href="/login" variant="contained" color="primary">
                Login
              </Button>
            )}
          </Box>
          <IconButton
            edge="end"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            onClick={() => setOpen(true)}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: "text.secondary" }}>
            Menu
          </Typography>
          <Divider />
          <List>
            {nav.map((item) => (
              <ListItemButton key={item.href} component={Link} href={item.href} onClick={() => setOpen(false)}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {user ? (
              <>
                <ListItemButton component={Link} href="/app" onClick={() => setOpen(false)}>
                  <ListItemText primary="Open portal" />
                </ListItemButton>
                <ListItemButton
                  onClick={async () => {
                    setOpen(false);
                    await signOut();
                  }}
                >
                  <ListItemText primary="Sign out" />
                </ListItemButton>
              </>
            ) : (
              <ListItemButton component={Link} href="/login" onClick={() => setOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
            )}
          </List>
          <Box sx={{ p: 2 }}>
            <TrackedButton
              component={Link}
              href="/founders"
              fullWidth
              variant="contained"
              color="secondary"
              eventName="cta_click_founders"
              eventProps={{ location: "mobile_drawer" }}
              onClick={() => setOpen(false)}
            >
              Join Founder Program
            </TrackedButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
