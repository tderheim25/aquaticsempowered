"use client";

import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
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
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/app/actions/auth";
import type { AppViewKey } from "@/lib/auth/viewPermissions";
import type { UserRole } from "@/types/database";

import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";

const drawerWidth = 260;

function normalizePath(path: string) {
  const p = path.replace(/\/$/, "") || "/";
  return p === "" ? "/" : p;
}

/** Dashboard home must match exactly `/app`, otherwise `/app/admin` incorrectly highlights Dashboard. */
function isNavItemActive(pathname: string, href: string) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (h === "/app") {
    return p === "/app";
  }
  /** Admin hub is only highlighted on the portal index, not on deeper admin routes (those use Admin tools). */
  if (h === "/app/admin") {
    return p === "/app/admin";
  }
  return p === h || p.startsWith(`${h}/`);
}

/** Routes that read/write org-scoped data; without org_id the server redirects to `/app/no-organization`. */
const ORG_SCOPED_VIEWS = new Set<AppViewKey>(["maintenance", "support_center"]);

const navItems: { label: string; href: string; soon: boolean; viewKey: AppViewKey; roles?: UserRole[] }[] = [
  { label: "Dashboard", href: "/app", soon: false, viewKey: "dashboard_home" },
  { label: "Chemical Logs", href: "/app/chemical-logs", soon: false, viewKey: "chemical_logs" },
  { label: "Maintenance", href: "/app/maintenance", soon: false, viewKey: "maintenance" },
  { label: "Support Center", href: "/app/support", soon: false, viewKey: "support_center" },
  { label: "Vendor Directory", href: "#", soon: true, viewKey: "vendor_directory" },
  { label: "Community", href: "#", soon: true, viewKey: "community" },
  { label: "Procurement", href: "#", soon: true, viewKey: "procurement" },
  { label: "Training / CPO", href: "#", soon: true, viewKey: "training_cpo" },
  { label: "Monitoring", href: "#", soon: true, viewKey: "monitoring" },
];

export function DashboardShell({
  displayName,
  orgName,
  planLabel,
  userRole,
  allowedViews,
  hasOrg,
  children,
}: {
  displayName: string;
  orgName: string | null;
  planLabel: string;
  userRole: UserRole | null;
  allowedViews: AppViewKey[];
  /** Set from `public.users.org_id`; facility tools need an org or the server redirects away. */
  hasOrg: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const [adminExpanded, setAdminExpanded] = useState(pathname.startsWith("/app/admin"));

  const allowedViewSet = new Set(allowedViews);

  const drawer = (
    <Box sx={{ pt: 2 }}>
      <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: "text.secondary" }}>
        Navigation
      </Typography>
      <Divider />
      <List>
        {navItems
          .filter((item) => allowedViewSet.has(item.viewKey))
          .filter((item) => !item.roles || (userRole ? item.roles.includes(userRole) : false))
          .map((item) => {
            const href =
              item.soon || !ORG_SCOPED_VIEWS.has(item.viewKey)
                ? item.href
                : hasOrg
                  ? item.href
                  : "/app/no-organization";
            const onNoOrgGate = normalizePath(pathname) === "/app/no-organization";
            const active =
              !item.soon && isNavItemActive(pathname, href) && !(onNoOrgGate && href === "/app/no-organization");
            return (
              <ListItemButton
                key={item.label}
                component={item.soon ? "div" : Link}
                href={item.soon ? undefined : href}
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

      {userRole === "super_admin" && allowedViewSet.has("admin_portal") ? (
        <List dense disablePadding sx={{ px: 1, pt: 1 }}>
          <ListItemButton
            selected={pathname.startsWith("/app/admin")}
            onClick={() => {
              setAdminExpanded((v) => !v);
              setMobileOpen(false);
            }}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText primary="Admin" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
            {adminExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          </ListItemButton>
          {adminExpanded ? (
            <List dense disablePadding sx={{ mt: 0.25 }}>
              <ListItemButton component={Link} href="/app/admin?section=users" selected={pathname === "/app/admin" && (section === "users" || !section)} sx={{ borderRadius: 1, pl: 3 }}>
                <ListItemText primary="Users" primaryTypographyProps={{ variant: "body2" }} />
              </ListItemButton>
              <ListItemButton component={Link} href="/app/admin?section=organizations" selected={pathname === "/app/admin" && section === "organizations"} sx={{ borderRadius: 1, pl: 3 }}>
                <ListItemText primary="Organizations" primaryTypographyProps={{ variant: "body2" }} />
              </ListItemButton>
              <ListItemButton component={Link} href="/app/admin?section=permissions" selected={pathname === "/app/admin" && section === "permissions"} sx={{ borderRadius: 1, pl: 3 }}>
                <ListItemText primary="Permissions" primaryTypographyProps={{ variant: "body2" }} />
              </ListItemButton>
              <ListItemButton component={Link} href="/app/admin?section=billing" selected={pathname === "/app/admin" && section === "billing"} sx={{ borderRadius: 1, pl: 3 }}>
                <ListItemText primary="Billing" primaryTypographyProps={{ variant: "body2" }} />
              </ListItemButton>
            </List>
          ) : null}
        </List>
      ) : null}
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
        <DashboardBreadcrumbs />
        {children}
      </Box>
    </Box>
  );
}
