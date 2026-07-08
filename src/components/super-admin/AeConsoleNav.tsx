"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  sidebarGroupHeaderSx,
  sidebarNavItemSx,
  sidebarNavScrollSx,
} from "@/components/navigation/sidebarStyles";
import { AE_CONSOLE_NAV_GROUPS } from "@/components/super-admin/aeConsoleNavConfig";
import { getSuperAdminPortalPath } from "@/lib/auth/superAdminPortalConstants";

export type AeConsoleNavBadges = Partial<Record<"vendors" | "support", number>>;

export function AeConsoleNav({
  badges = {},
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  badges?: AeConsoleNavBadges;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "overview";
  const base = getSuperAdminPortalPath();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (pathname !== base) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        py: 1.5,
      }}
    >
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          pb: 1.5,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
        }}
      >
        {!collapsed ? (
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: "0.12em", color: "primary.main" }}>
              Console
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Platform control
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
                transition: (theme) => theme.transitions.create("transform"),
                "&:hover": { transform: "scale(1.05)" },
              }}
            >
              {collapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      <Divider sx={{ mx: collapsed ? 1 : 2, opacity: 0.6, flexShrink: 0 }} />

      <Box sx={sidebarNavScrollSx}>
        {AE_CONSOLE_NAV_GROUPS.map((group, groupIndex) => (
          <Box key={group.title} sx={{ mt: groupIndex > 0 ? 1.5 : 0.5 }}>
            {!collapsed ? (
              <Typography variant="caption" sx={sidebarGroupHeaderSx}>
                {group.title}
              </Typography>
            ) : null}
            <List dense disablePadding>
              {group.items.map((item) => {
                const Icon = item.icon;
                const selected = section === item.key;
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;
                const showBadge = typeof badgeCount === "number" && badgeCount > 0;

                const button = (
                  <ListItemButton
                    key={item.key}
                    component={Link}
                    href={`${base}?section=${item.key}`}
                    selected={selected}
                    onClick={onNavigate}
                    onMouseEnter={() => setHoveredKey(item.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    sx={{
                      ...sidebarNavItemSx,
                      px: collapsed ? 1.25 : 1.75,
                      justifyContent: collapsed ? "center" : "flex-start",
                      animation:
                        hoveredKey === item.key && !selected
                          ? "aeNavPulse 0.45s ease"
                          : undefined,
                      "@keyframes aeNavPulse": {
                        "0%": { transform: "translateX(0)" },
                        "50%": { transform: "translateX(4px)" },
                        "100%": { transform: "translateX(2px)" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 40,
                        justifyContent: "center",
                        color: selected ? "inherit" : "primary.main",
                        transition: (theme) => theme.transitions.create("color"),
                      }}
                    >
                      {showBadge ? (
                        <Badge badgeContent={badgeCount} color="warning" max={99}>
                          <Icon fontSize="small" />
                        </Badge>
                      ) : (
                        <Icon fontSize="small" />
                      )}
                    </ListItemIcon>
                    {!collapsed ? (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: selected ? 700 : 500,
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                );

                return collapsed ? (
                  <Tooltip key={item.key} title={item.label} placement="right" arrow>
                    <Box component="span" sx={{ display: "block" }}>
                      {button}
                    </Box>
                  </Tooltip>
                ) : (
                  button
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
