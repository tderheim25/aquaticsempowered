"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";

const drawerWidth = 260;

const navItems: { label: string; href: string; soon: boolean }[] = [
  { label: "Dashboard", href: "/app", soon: false },
  { label: "Chemical Logs", href: "#", soon: true },
  { label: "Maintenance", href: "#", soon: true },
  { label: "Support Center", href: "#", soon: true },
  { label: "Vendor Directory", href: "#", soon: true },
  { label: "Community", href: "#", soon: true },
  { label: "Procurement", href: "#", soon: true },
  { label: "Training / CPO", href: "#", soon: true },
  { label: "Monitoring", href: "#", soon: true },
  { label: "Admin", href: "#", soon: true },
];

export function DashboardShell({
  displayName,
  orgName,
  planLabel,
  children,
}: {
  displayName: string;
  orgName: string | null;
  planLabel: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();

  const drawer = (
    <Box sx={{ pt: 2 }}>
      <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: "text.secondary" }}>
        Navigation
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => {
          const active = !item.soon && pathname === item.href;
          return (
            <ListItemButton
              key={item.label}
              component={item.soon ? "div" : Link}
              href={item.soon ? undefined : item.href}
              selected={active}
              disabled={item.soon}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary={item.label} />
              {item.soon && <Chip label="Soon" size="small" sx={{ ml: 1 }} />}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          {!mdUp && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component={Link}
            href="/app"
            sx={{ flexGrow: 1, fontWeight: 800, color: "primary.main", textDecoration: "none" }}
          >
            Aquatics Empowered
          </Typography>
          <Chip label={planLabel} size="small" sx={{ mr: 1, display: { xs: "none", sm: "flex" } }} />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" aria-label="account menu">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {displayName?.charAt(0)?.toUpperCase() ?? "U"}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="subtitle2">{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {orgName ?? "No organization linked"}
              </Typography>
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
        >
          <Toolbar />
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: 1, borderColor: "divider" },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
