"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { TrackedButton } from "@/components/marketing/TrackedButton";

const nav = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
  { href: "/vendors", label: "Vendors" },
  { href: "/community", label: "Community" },
  { href: "/founders", label: "Founder Program" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
            <Button component={Link} href="/login" variant="contained" color="primary">
              Login
            </Button>
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
            <ListItemButton component={Link} href="/login" onClick={() => setOpen(false)}>
              <ListItemText primary="Login" />
            </ListItemButton>
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
