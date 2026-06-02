"use client";

import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { CommunityActivityItem, CommunityActivitySummary } from "@/lib/community/loadCommunityActivity";

const POLL_MS = 5_000;
const ACTIVITY_REFRESH_EVENT = "community-activity-refresh";

/** Routes where the community notifications bell is shown. */
export function isCommunityRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/community" || p.startsWith("/community/profile") || p.startsWith("/app/community");
}

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
        minWidth: 18,
        height: 18,
        px: 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        bgcolor: "error.main",
        color: "error.contrastText",
        fontSize: "0.65rem",
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

export function markCommunityActivitySeen() {
  return fetch("/api/community/activity/seen", { method: "POST" });
}

export function useCommunityActivity(enabled: boolean) {
  const [activity, setActivity] = useState<CommunityActivitySummary | null>(null);
  const instanceId = useId();
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActivity(null);
      return;
    }
    try {
      const res = await fetch("/api/community/activity", { cache: "no-store" });
      if (!res.ok) {
        setActivity(null);
        return;
      }
      setActivity((await res.json()) as CommunityActivitySummary);
    } catch {
      setActivity(null);
    }
  }, [enabled]);

  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const runRefresh = () => void refreshRef.current();

    runRefresh();
    const pollId = window.setInterval(runRefresh, POLL_MS);

    const onFocus = () => runRefresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") runRefresh();
    };
    const onEngagement = () => runRefresh();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(ACTIVITY_REFRESH_EVENT, onEngagement);

    const supabase = createClient();
    // Unique per hook instance — SiteHeader mounts desktop + mobile bells at once.
    const channelName = `community-notifications${instanceId.replace(/:/g, "")}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_network_requests" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "community_network_requests" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_follows" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_post_comments" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_post_comments" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_likes" },
        runRefresh
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_likes" },
        runRefresh
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") runRefresh();
      });

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(ACTIVITY_REFRESH_EVENT, onEngagement);
      void supabase.removeChannel(channel);
    };
  }, [enabled, instanceId]);

  return { activity, refresh };
}

function activityMessage(item: CommunityActivityItem): string {
  switch (item.kind) {
    case "connection_request":
      return `${item.requesterName} sent a connection request`;
    case "new_follower":
      return `${item.followerName} started following you`;
    case "post_comment":
      return `${item.authorName} commented on your post`;
    case "post_like":
      return `${item.likerName} liked your post`;
    default:
      return "New activity";
  }
}

function ActivityIcon({ item }: { item: CommunityActivityItem }) {
  switch (item.kind) {
    case "connection_request":
      return <GroupAddIcon fontSize="small" color="primary" />;
    case "new_follower":
      return <PersonAddIcon fontSize="small" color="primary" />;
    case "post_comment":
      return <ChatBubbleOutlineIcon fontSize="small" color="primary" />;
    case "post_like":
      return <FavoriteBorderIcon fontSize="small" color="error" />;
    default:
      return <NotificationsNoneOutlinedIcon fontSize="small" />;
  }
}

function ActivityDetail({ item }: { item: CommunityActivityItem }) {
  if (item.kind === "post_comment") {
    return (
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
        {item.commentPreview ? `"${item.commentPreview}"` : null}
        {item.postPreview ? ` · on "${item.postPreview}"` : null}
      </Typography>
    );
  }
  if (item.kind === "post_like" && item.postPreview) {
    return (
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
        {`"${item.postPreview}"`}
      </Typography>
    );
  }
  return null;
}

export function CommunityNotificationsMenuItems({
  activity,
  onNavigate,
}: {
  activity: CommunityActivitySummary | null;
  onNavigate: () => void;
}) {
  if (!activity) {
    return (
      <MenuItem disabled>
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </MenuItem>
    );
  }

  if (activity.total <= 0) {
    return (
      <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          All caught up
        </Typography>
        <Typography variant="caption" color="text.secondary">
          New connection requests, comments, and likes will appear here.
        </Typography>
      </MenuItem>
    );
  }

  return (
    <>
      <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Notifications
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {activity.total} new
        </Typography>
      </MenuItem>
      {activity.items.slice(0, 12).map((item) => (
        <MenuItem
          key={`${item.kind}-${item.id}`}
          component={Link}
          href={item.href}
          onClick={onNavigate}
          sx={{ alignItems: "flex-start", py: 1.25, whiteSpace: "normal" }}
        >
          <ListItemIcon sx={{ mt: 0.25 }}>
            <ActivityIcon item={item} />
          </ListItemIcon>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {activityMessage(item)}
            </Typography>
            <ActivityDetail item={item} />
          </Box>
        </MenuItem>
      ))}
      {(activity.connectionRequestCount > 0 || activity.newFollowerCount > 0) && (
        <MenuItem component={Link} href={activity.connectionsHref} onClick={onNavigate}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
            View connections
          </Typography>
        </MenuItem>
      )}
      {(activity.postCommentCount > 0 || activity.postLikeCount > 0) && (
        <MenuItem component={Link} href={activity.communityFeedHref} onClick={onNavigate}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
            View community feed
          </Typography>
        </MenuItem>
      )}
      <Divider />
    </>
  );
}

/** Bell icon with badge and dropdown menu (community routes). */
export function CommunityNotificationsBell({ enabled }: { enabled: boolean }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { activity, refresh } = useCommunityActivity(enabled);
  const open = Boolean(anchorEl);
  const count = activity?.total ?? 0;

  const handleOpen = (el: HTMLElement) => {
    setAnchorEl(el);
    if (count > 0) {
      void markCommunityActivitySeen().then(() => refresh());
    }
  };

  const handleClose = () => setAnchorEl(null);

  if (!enabled) return null;

  return (
    <>
      <IconButton
        size="small"
        color="inherit"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        onClick={(e) => handleOpen(e.currentTarget)}
        sx={{
          position: "relative",
          color: open || count > 0 ? "primary.main" : "text.secondary",
          "&:hover": {
            color: "primary.main",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          },
        }}
      >
        <Badge
          badgeContent={count > 0 ? (count > 99 ? "99+" : count) : undefined}
          color="error"
          overlap="circular"
          invisible={count <= 0}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.65rem",
              fontWeight: 700,
              minWidth: 18,
              height: 18,
            },
          }}
        >
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 300,
              maxWidth: 360,
              maxHeight: "min(70vh, 480px)",
              borderRadius: 2,
              boxShadow: "0 16px 40px -12px rgba(15, 23, 42, 0.2)",
            },
          },
        }}
      >
        <CommunityNotificationsMenuItems
          activity={activity}
          onNavigate={() => {
            handleClose();
            void refresh();
          }}
        />
      </Menu>
    </>
  );
}

/** @deprecated Use CommunityNotificationsMenuItems — kept for account menu embed. */
export function CommunityActivityMenuItems({
  activity,
  onNavigate,
}: {
  activity: CommunityActivitySummary | null;
  onNavigate: () => void;
}) {
  return <CommunityNotificationsMenuItems activity={activity} onNavigate={onNavigate} />;
}
