"use client";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import {
  Box,
  Divider,
  ListItemIcon,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { CommunityActivitySummary } from "@/lib/community/loadCommunityActivity";

/** Routes where community activity badge is shown on the account avatar. */
export function isCommunityRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/community" || p.startsWith("/app/community");
}

/** Red count pill matching CommunityFloatingChat FAB badge. */
export function CommunityUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        position: "absolute",
        top: -4,
        right: -4,
        zIndex: 2,
        minWidth: 22,
        height: 22,
        px: 0.75,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        bgcolor: "error.main",
        color: "error.contrastText",
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
        pointerEvents: "none",
      }}
    >
      {count > 99 ? "99+" : count}
    </Box>
  );
}

export function useCommunityActivity(enabled: boolean) {
  const [activity, setActivity] = useState<CommunityActivitySummary | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActivity(null);
      return;
    }
    try {
      const res = await fetch("/api/community/activity");
      if (!res.ok) {
        setActivity(null);
        return;
      }
      setActivity((await res.json()) as CommunityActivitySummary);
    } catch {
      setActivity(null);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { activity, refresh };
}

export function markCommunityActivitySeen() {
  return fetch("/api/community/activity/seen", { method: "POST" });
}

type CommunityActivityMenuItemsProps = {
  activity: CommunityActivitySummary | null;
  onNavigate: () => void;
};

export function CommunityActivityMenuItems({ activity, onNavigate }: CommunityActivityMenuItemsProps) {
  if (!activity || activity.total <= 0) return null;

  return (
    <>
      <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important" }}>
        <Typography variant="subtitle2">Community activity</Typography>
        <Typography variant="caption" color="text.secondary">
          {activity.total} new notification{activity.total === 1 ? "" : "s"}
        </Typography>
      </MenuItem>
      {activity.items.slice(0, 8).map((item) => {
        if (item.kind === "connection_request") {
          return (
            <MenuItem
              key={`req-${item.id}`}
              component={Link}
              href={activity.connectionsHref}
              onClick={onNavigate}
            >
              <ListItemIcon>
                <GroupAddIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <Typography variant="body2">
                <strong>{item.requesterName}</strong> sent a connection request
              </Typography>
            </MenuItem>
          );
        }
        return (
          <MenuItem
            key={`fol-${item.id}`}
            component={Link}
            href={activity.connectionsHref}
            onClick={onNavigate}
          >
            <ListItemIcon>
              <PersonAddIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <Typography variant="body2">
              <strong>{item.followerName}</strong> started following you
            </Typography>
          </MenuItem>
        );
      })}
      <MenuItem component={Link} href={activity.connectionsHref} onClick={onNavigate}>
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          View all in Connections
        </Typography>
      </MenuItem>
      <Divider />
    </>
  );
}
