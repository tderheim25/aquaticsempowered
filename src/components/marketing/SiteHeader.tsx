"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
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
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { CommunityNotificationsBell } from "@/components/community/CommunityNotificationsBell";
import { TrackedButton } from "@/components/marketing/TrackedButton";

const nav = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/vendors", label: "Vendors" },
  { href: "/community", label: "Community" },
  { href: "/founders", label: "Founder Program" },
];

export type MarketingHeaderUser = {
  displayName: string;
  avatarUrl: string | null;
  /** Community profile page for the signed-in user. */
  profileHref: string;
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user?: MarketingHeaderUser | null }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const showCommunityNotifications = Boolean(
    user && pathname && (pathname === "/community" || pathname.startsWith("/community/"))
  );

  const initial = user?.displayName?.trim().charAt(0)?.toUpperCase() ?? "U";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openAccountMenu = (el: HTMLElement) => setAnchorEl(el);

  return (
    <>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
          width: "100%",
          transition: "background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, backdrop-filter 220ms ease",
          bgcolor: scrolled ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.55)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
          borderBottom: "1px solid",
          borderColor: scrolled ? "rgba(15, 23, 42, 0.08)" : "rgba(15, 23, 42, 0.04)",
          boxShadow: scrolled ? "0 8px 24px -16px rgba(15, 23, 42, 0.18)" : "none",
        }}
      >
        <Box
          sx={{
            width: "100%",
            px: { xs: 2, sm: 3, md: 4, lg: 5 },
            height: { xs: 64, md: 72 },
            display: "grid",
            gridTemplateColumns: { xs: "auto 1fr", md: "1fr auto 1fr" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <BrandMark />
          </Box>

          {/* Desktop nav — Right-aligned, Outfit font, widely spaced */}
          <Box
            component="nav"
            aria-label="Primary"
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "flex-end",
              gap: { md: 4, lg: 6 }, // Much wider spacing between menus
              ml: "auto",
              mr: { md: 4, lg: 6 },
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
            }}
          >
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 1,
                    fontFamily: "inherit",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.95rem",
                    letterSpacing: "0.01em",
                    textDecoration: "none",
                    color: active ? "text.primary" : "text.secondary",
                    transition: "color 200ms ease, transform 200ms ease",
                    "&:hover": {
                      color: "text.primary",
                      transform: "translateY(-1px)",
                    },
                    "&:hover .nav-active-indicator": {
                      opacity: 1,
                      transform: "scaleX(1)",
                    },
                  }}
                >
                  <Box component="span" sx={{ fontFamily: "inherit" }}>
                    {item.label}
                  </Box>

                  {/* Clean active indicator: glowing underline */}
                  <Box
                    component="span"
                    aria-hidden
                    className="nav-active-indicator"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: "10%",
                      right: "10%",
                      height: 3,
                      borderRadius: 2,
                      background: "linear-gradient(90deg, #003B6F 0%, #2EA5A0 100%)",
                      opacity: active ? 1 : 0,
                      transform: active ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "center",
                      transition: "opacity 240ms ease, transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          {/* Right side */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: { xs: 1, sm: 1.25 } }}>
            {user ? (
              <>
                <Button
                  component={Link}
                  href="/app"
                  variant="contained"
                  size="small"
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    px: 1.75,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: "linear-gradient(135deg, #003B6F 0%, #0a4d8c 50%, #2EA5A0 100%)",
                    boxShadow: "0 6px 16px -8px rgba(0, 59, 111, 0.45)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0a4d8c 0%, #0d6394 50%, #36b8b2 100%)",
                      boxShadow: "0 8px 20px -8px rgba(0, 59, 111, 0.55)",
                    },
                  }}
                >
                  Go to Dashboard
                </Button>
                {showCommunityNotifications ? <CommunityNotificationsBell enabled /> : null}
                <IconButton
                  onClick={(e) => openAccountMenu(e.currentTarget)}
                  size="small"
                  aria-label="Account menu"
                  sx={{ p: 0.25 }}
                >
                  <CommunityAvatar src={user.avatarUrl} initials={initial} size={36} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 240,
                        borderRadius: 2,
                        boxShadow: "0 16px 40px -12px rgba(15, 23, 42, 0.2)",
                      },
                    },
                  }}
                >
                  <MenuItem
                    disabled
                    sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important", py: 1.25 }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Signed in
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem component={Link} href={user.profileHref} onClick={() => setAnchorEl(null)}>
                    View profile
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
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  size="medium"
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    color: "text.primary",
                    fontWeight: 600,
                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                  }}
                >
                  Log in
                </Button>
                <TrackedButton
                  component={Link}
                  href="/founders"
                  variant="contained"
                  size="medium"
                  endIcon={<ArrowForwardRoundedIcon />}
                  eventName="cta_click_founders"
                  eventProps={{ location: "header_primary" }}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    px: 2.25,
                    py: 1,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #003B6F 0%, #0a4d8c 50%, #2EA5A0 100%)",
                    boxShadow: "0 8px 20px -8px rgba(0, 59, 111, 0.5)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0a4d8c 0%, #0d6394 50%, #36b8b2 100%)",
                      boxShadow: "0 12px 26px -8px rgba(0, 59, 111, 0.65)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 200ms ease",
                  }}
                >
                  Get started
                </TrackedButton>
              </>
            )}

            <IconButton
              edge="end"
              size="medium"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              sx={{
                display: { xs: "inline-flex", md: "none" },
                ml: 0.5,
                color: "text.primary",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.1) },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "85vw", sm: 360 },
              maxWidth: 400,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              background:
                "linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)",
              boxShadow: "-24px 0 60px -20px rgba(15, 23, 42, 0.25)",
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandMark />
          <IconButton
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            sx={{ color: "text.primary" }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider sx={{ opacity: 0.6 }} />

        <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                onClick={() => setOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: 2,
                  py: 1.25,
                  position: "relative",
                  color: active ? "primary.main" : "text.primary",
                  bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.08) : "transparent",
                  "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 6,
                    top: "50%",
                    width: 3,
                    height: 18,
                    borderRadius: 2,
                    background: "linear-gradient(180deg, #003B6F, #2EA5A0)",
                    transform: `translateY(-50%) scaleY(${active ? 1 : 0})`,
                    transformOrigin: "center",
                    transition: "transform 200ms ease",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 600,
                    fontSize: "1rem",
                  }}
                />
              </ListItemButton>
            );
          })}

          {user ? (
            <>
              <Divider sx={{ my: 1.5, opacity: 0.6 }} />
              {showCommunityNotifications ? (
                <Box sx={{ px: 1, py: 0.5, display: "flex", justifyContent: "center" }}>
                  <CommunityNotificationsBell enabled />
                </Box>
              ) : null}
              <ListItemButton
                component={Link}
                href="/app"
                onClick={() => setOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary="Go to Dashboard" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
              <ListItemButton
                component={Link}
                href={user.profileHref}
                onClick={() => setOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText primary="View profile" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
              <ListItemButton
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemText primary="Sign out" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </>
          ) : null}
        </List>

        {!user ? (
          <Box sx={{ p: 2, pt: 0 }}>
            <Stack spacing={1.25}>
              <TrackedButton
                component={Link}
                href="/founders"
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                eventName="cta_click_founders"
                eventProps={{ location: "mobile_drawer" }}
                onClick={() => setOpen(false)}
                sx={{
                  py: 1.25,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #003B6F 0%, #0a4d8c 50%, #2EA5A0 100%)",
                  boxShadow: "0 10px 24px -10px rgba(0, 59, 111, 0.55)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #0a4d8c 0%, #0d6394 50%, #36b8b2 100%)",
                  },
                }}
              >
                Get started
              </TrackedButton>
              <Button
                component={Link}
                href="/login"
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setOpen(false)}
                sx={{
                  py: 1.15,
                  fontWeight: 600,
                  color: "text.primary",
                  borderColor: "divider",
                  "&:hover": { borderColor: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
                }}
              >
                Log in
              </Button>
            </Stack>
            <Typography
              variant="caption"
              sx={{ display: "block", textAlign: "center", color: "text.secondary", mt: 2 }}
            >
              © {new Date().getFullYear()} Aquatics Empowered
            </Typography>
          </Box>
        ) : null}
      </Drawer>
    </>
  );
}
