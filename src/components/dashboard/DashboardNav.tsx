"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  DASHBOARD_AE_CONSOLE_NAV,
  DASHBOARD_FACILITY_NAV,
  DASHBOARD_POOL_OPS_GROUPS,
  DASHBOARD_TOP_NAV,
  type DashboardNavGroup,
  type DashboardNavLink,
} from "@/components/dashboard/dashboardNavConfig";
import { SuperAdminOrgSwitcher } from "@/components/dashboard/SuperAdminOrgSwitcher";
import {
  sidebarGroupHeaderSx,
  sidebarNavItemSx,
} from "@/components/navigation/sidebarStyles";
import type { AppViewKey } from "@/lib/auth/viewPermissions";
import { hrefWithOrg, type OrgOption } from "@/lib/auth/activeOrgShared";
import type { UserRole } from "@/types/database";

const ORG_SCOPED_VIEWS = new Set<AppViewKey>([
  "pools",
  "chemical_logs",
  "maintenance",
  "monitoring",
  "procurement",
]);

function normalizePath(path: string) {
  const p = path.replace(/\/$/, "") || "/";
  return p === "" ? "/" : p;
}

function isNavItemActive(pathname: string, href: string) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (h === "/app") return p === "/app";
  return p === h || p.startsWith(`${h}/`);
}

function resolveHref(
  viewKey: AppViewKey,
  href: string,
  hasOrg: boolean,
  superAdminOrgId?: string | null
) {
  if (!ORG_SCOPED_VIEWS.has(viewKey)) return href;
  if (!hasOrg && !superAdminOrgId) return "/app/no-organization";
  if (superAdminOrgId) return hrefWithOrg(href, superAdminOrgId);
  return href;
}

function NavLeafButton({
  href,
  label,
  icon: Icon,
  selected,
  collapsed,
  onNavigate,
  pro,
}: {
  href: string;
  label: string;
  icon: DashboardNavLink["icon"];
  selected: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  pro?: boolean;
}) {
  const button = (
    <ListItemButton
      component={Link}
      href={href}
      selected={selected}
      onClick={onNavigate}
      sx={{
        ...sidebarNavItemSx,
        px: collapsed ? 1.25 : 1.75,
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 0 : 40,
          justifyContent: "center",
          color: selected ? "inherit" : "primary.main",
        }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      {!collapsed ? (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            variant: "body2",
            fontWeight: selected ? 700 : 500,
          }}
        />
      ) : null}
      {!collapsed && pro ? <Chip label="Pro" size="small" sx={{ ml: 0.5, height: 20 }} /> : null}
    </ListItemButton>
  );

  if (!collapsed) return button;

  return (
    <Tooltip title={label} placement="right" arrow>
      <Box component="span" sx={{ display: "block" }}>
        {button}
      </Box>
    </Tooltip>
  );
}

function NavGroupSection({
  group,
  pathname,
  allowed,
  hasOrg,
  superAdminOrgId,
  expanded,
  onToggle,
  onNavigate,
  userRole,
  collapsed,
}: {
  group: DashboardNavGroup;
  pathname: string;
  allowed: boolean;
  hasOrg: boolean;
  superAdminOrgId?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  userRole: UserRole | null;
  collapsed: boolean;
}) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  if (!allowed) return null;
  if (group.roles && (!userRole || !group.roles.includes(userRole))) return null;

  const GroupIcon = group.icon;

  if (!group.children) {
    const href = resolveHref(group.viewKey, group.href!, hasOrg, superAdminOrgId);
    const active = isNavItemActive(pathname, href);
    return (
      <NavLeafButton
        href={href}
        label={group.label}
        icon={GroupIcon}
        selected={active}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    );
  }

  const groupActive = group.children.some((c) =>
    isNavItemActive(pathname, resolveHref(group.viewKey, c.href, hasOrg, superAdminOrgId))
  );

  if (collapsed) {
    return (
      <>
        <Tooltip title={group.label} placement="right" arrow>
          <ListItemButton
            selected={groupActive}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              ...sidebarNavItemSx,
              px: 1.25,
              justifyContent: "center",
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", color: groupActive ? "inherit" : "primary.main" }}>
              <GroupIcon fontSize="small" />
            </ListItemIcon>
          </ListItemButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {group.children.map((child) => {
            const href = resolveHref(group.viewKey, child.href, hasOrg, superAdminOrgId);
            const active = isNavItemActive(pathname, href);
            const ChildIcon = child.icon;
            return (
              <MenuItem
                key={child.href}
                component={Link}
                href={href}
                selected={active}
                onClick={() => {
                  setMenuAnchor(null);
                  onNavigate();
                }}
                sx={{ gap: 1.5, minWidth: 200 }}
              >
                <ChildIcon fontSize="small" color={active ? "primary" : "action"} />
                {child.label}
                {child.pro ? <Chip label="Pro" size="small" sx={{ ml: "auto", height: 20 }} /> : null}
              </MenuItem>
            );
          })}
        </Menu>
      </>
    );
  }

  return (
    <Box>
      <ListItemButton
        onClick={onToggle}
        selected={groupActive && !expanded}
        sx={{
          ...sidebarNavItemSx,
          px: 1.75,
          ...(groupActive && !expanded
            ? {
                bgcolor: "action.selected",
                "&:hover": { bgcolor: "action.selected" },
              }
            : {}),
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
          <GroupIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={group.label}
          primaryTypographyProps={{ variant: "body2", fontWeight: groupActive ? 700 : 500 }}
        />
        {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
      </ListItemButton>
      <Collapse in={expanded} timeout={200}>
        <List dense disablePadding>
          {group.children.map((child) => {
            const href = resolveHref(group.viewKey, child.href, hasOrg, superAdminOrgId);
            const active = isNavItemActive(pathname, href);
            const ChildIcon = child.icon;
            return (
              <ListItemButton
                key={child.href}
                component={Link}
                href={href}
                selected={active}
                onClick={onNavigate}
                sx={{
                  ...sidebarNavItemSx,
                  pl: 3.5,
                  pr: 1.75,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: active ? "inherit" : "primary.main",
                  }}
                >
                  <ChildIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={child.label}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: active ? 700 : 500,
                  }}
                />
                {child.pro ? <Chip label="Pro" size="small" sx={{ ml: 0.5, height: 20 }} /> : null}
              </ListItemButton>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}

export function DashboardNav({
  allowedViews,
  hasOrg,
  superAdminOrgOptions,
  superAdminActiveOrgId,
  userRole,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  allowedViews: AppViewKey[];
  hasOrg: boolean;
  superAdminOrgOptions?: OrgOption[];
  superAdminActiveOrgId?: string | null;
  userRole: UserRole | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const allowedViewSet = useMemo(() => new Set(allowedViews), [allowedViews]);
  const showOrgSwitcher = userRole === "super_admin" && (superAdminOrgOptions?.length ?? 0) > 0;

  const defaultExpanded = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const g of DASHBOARD_POOL_OPS_GROUPS) {
      if (g.children) {
        map[g.label] = g.children.some((c) => isNavItemActive(pathname, c.href));
      }
    }
    return map;
  }, [pathname]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(defaultExpanded);

  useEffect(() => {
    setExpanded((prev) => ({ ...prev, ...defaultExpanded }));
  }, [defaultExpanded]);

  const handleNavigate = () => onNavigate?.();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        py: 1.5,
      }}
    >
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          pb: 1.5,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
        }}
      >
        {!collapsed ? (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: "0.12em", color: "primary.main" }}>
              Portal
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Pool operations
            </Typography>
          </Box>
        ) : null}
        {onToggleCollapse ? (
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                flexShrink: 0,
                transition: (theme) => theme.transitions.create("transform"),
                "&:hover": { transform: "scale(1.05)" },
              }}
            >
              {collapsed ? (
                <ChevronRightRoundedIcon fontSize="small" />
              ) : (
                <ChevronLeftRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      {showOrgSwitcher && !collapsed ? (
        <>
          <SuperAdminOrgSwitcher orgs={superAdminOrgOptions!} activeOrgId={superAdminActiveOrgId ?? null} />
          <Divider sx={{ mx: 2, opacity: 0.6, mb: 0.5 }} />
        </>
      ) : null}

      <Divider sx={{ mx: collapsed ? 1 : 2, opacity: 0.6 }} />

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1 }}>
        {!collapsed ? (
          <Typography variant="caption" sx={sidebarGroupHeaderSx}>
            Home
          </Typography>
        ) : null}
        <List dense disablePadding>
          {DASHBOARD_TOP_NAV.filter((item) => allowedViewSet.has(item.viewKey))
            .filter((item) => !item.roles || (userRole ? item.roles.includes(userRole) : false))
            .map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <NavLeafButton
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  selected={active}
                  collapsed={collapsed}
                  onNavigate={handleNavigate}
                />
              );
            })}
          {userRole === "super_admin" ? (
            <NavLeafButton
              href={DASHBOARD_AE_CONSOLE_NAV.href}
              label={DASHBOARD_AE_CONSOLE_NAV.label}
              icon={DASHBOARD_AE_CONSOLE_NAV.icon}
              selected={isNavItemActive(pathname, DASHBOARD_AE_CONSOLE_NAV.href)}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ) : null}
        </List>

        {!collapsed ? (
          <Typography variant="caption" sx={{ ...sidebarGroupHeaderSx, mt: 1.5 }}>
            Pool Operations
          </Typography>
        ) : null}
        <List dense disablePadding sx={{ mt: collapsed ? 0.5 : 0 }}>
          {DASHBOARD_POOL_OPS_GROUPS.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              pathname={pathname}
              allowed={allowedViewSet.has(group.viewKey)}
              hasOrg={hasOrg}
              superAdminOrgId={superAdminActiveOrgId}
              expanded={expanded[group.label] ?? false}
              onToggle={() => setExpanded((e) => ({ ...e, [group.label]: !e[group.label] }))}
              onNavigate={handleNavigate}
              userRole={userRole}
              collapsed={collapsed}
            />
          ))}
        </List>

        {!collapsed ? (
          <Typography variant="caption" sx={{ ...sidebarGroupHeaderSx, mt: 1.5 }}>
            Facility
          </Typography>
        ) : null}
        <List dense disablePadding sx={{ mt: collapsed ? 0.5 : 0 }}>
          {DASHBOARD_FACILITY_NAV.filter((item) => allowedViewSet.has(item.viewKey)).map((item) => {
            const href = resolveHref(item.viewKey, item.href, hasOrg, superAdminActiveOrgId);
            const active = isNavItemActive(pathname, href);
            return (
              <NavLeafButton
                key={item.href}
                href={href}
                label={item.label}
                icon={item.icon}
                selected={active}
                collapsed={collapsed}
                onNavigate={handleNavigate}
              />
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
