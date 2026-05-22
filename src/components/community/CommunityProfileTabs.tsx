"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { CommunityProfilePostsLive } from "@/components/community/CommunityProfilePostsLive";
import {
  acceptNetworkRequestAction,
  declineNetworkRequestAction,
  markCommunityConnectionsSeenAction,
} from "@/app/(dashboard)/app/community/actions";

import { CommunityAvatar } from "./CommunityAvatar";
import {
  communityContainedButtonSx,
  communityOutlinedButtonSx,
  communitySectionTitleSx,
  communitySurfacePaperSx,
  communityTabsSx,
} from "./communityUi";

export type ProfileOwner = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  email: string;
};

export type ProfileTabPost = {
  id: string;
  body: string;
  created_at: string;
  images: { storage_path: string; signedUrl: string }[];
  comments: ResolvedPostComment[];
};

export type ProfileTabPerson = {
  id: string;
  full_name: string | null;
  email: string;
  /** Shown on your profile after you have opened Connections at least once. */
  isNewFollower?: boolean;
};

export type ProfileTabPhoto = {
  storage_path: string;
  signedUrl: string;
};

export type IncomingNetworkRequest = {
  requestId: string;
  from: ProfileTabPerson;
};

function personLabel(p: ProfileTabPerson) {
  return p.full_name?.trim() || p.email.split("@")[0] || "Member";
}

function personInitials(p: ProfileTabPerson) {
  return personLabel(p).slice(0, 2).toUpperCase();
}

function TabPanel({ children, value, index }: { children: ReactNode; value: number; index: number }) {
  if (value !== index) return null;
  return (
    <Box
      role="tabpanel"
      id={`profile-tabpanel-${index}`}
      sx={{ pt: 2, px: { xs: 2, sm: 2.5 }, pb: 2.5 }}
      aria-labelledby={`profile-tab-${index}`}
    >
      {children}
    </Box>
  );
}

export function CommunityProfileTabs({
  profileOwner,
  posts,
  followers,
  following,
  networkPeers = [],
  incomingNetworkRequests = [],
  photos,
  viewerId,
  commentsRedirectTo,
  networkActionRedirectTo = "",
  isSelfProfile = false,
  connectionsTabBadgeCount = 0,
  unseenFollowerCount = 0,
  initialTab = 0,
}: {
  profileOwner: ProfileOwner;
  posts: ProfileTabPost[];
  followers: ProfileTabPerson[];
  following: ProfileTabPerson[];
  networkPeers?: ProfileTabPerson[];
  incomingNetworkRequests?: IncomingNetworkRequest[];
  photos: ProfileTabPhoto[];
  viewerId: string;
  commentsRedirectTo: string;
  networkActionRedirectTo?: string;
  isSelfProfile?: boolean;
  connectionsTabBadgeCount?: number;
  unseenFollowerCount?: number;
  /** 0 posts, 1 connections, 2 photos, 3 events */
  initialTab?: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isSelfProfile || tab !== 1 || unseenFollowerCount < 1) return;
    let cancelled = false;
    void (async () => {
      await markCommunityConnectionsSeenAction();
      if (!cancelled) router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, isSelfProfile, router, unseenFollowerCount]);

  return (
    <Paper variant="outlined" sx={{ width: "100%", ...communitySurfacePaperSx({ p: 0 }) }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ ...communityTabsSx, px: { xs: 1, sm: 2 } }}
      >
        <Tab id="profile-tab-0" aria-controls="profile-tabpanel-0" label="Posts" />
        <Tab
          id="profile-tab-1"
          aria-controls="profile-tabpanel-1"
          label={
            <Badge
              color="error"
              variant="dot"
              invisible={!isSelfProfile || connectionsTabBadgeCount < 1}
              sx={{
                pl: 0.5,
                pr: isSelfProfile && connectionsTabBadgeCount > 0 ? 1.25 : 0,
                "& .MuiBadge-badge": { top: 6, right: isSelfProfile && connectionsTabBadgeCount > 0 ? 2 : -4 },
              }}
            >
              <Typography component="span" variant="inherit">
                Connections
              </Typography>
            </Badge>
          }
          aria-label={
            isSelfProfile && connectionsTabBadgeCount > 0
              ? `Connections, ${connectionsTabBadgeCount} new`
              : "Connections"
          }
        />
        <Tab id="profile-tab-2" aria-controls="profile-tabpanel-2" label="Photos" />
        <Tab id="profile-tab-3" aria-controls="profile-tabpanel-3" label="Events" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Typography variant="h6" sx={{ ...communitySectionTitleSx, mb: 1.5 }}>
          Posts
        </Typography>
        {posts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No posts yet.
          </Typography>
        ) : (
          <CommunityProfilePostsLive
            profileOwner={profileOwner}
            posts={posts}
            viewerId={viewerId}
            commentsRedirectTo={commentsRedirectTo}
          />
        )}
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Stack spacing={3}>
          {isSelfProfile ? (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ ...communitySectionTitleSx, fontSize: "0.875rem", mb: 1 }}>
                  Connection requests
                </Typography>
                {incomingNetworkRequests.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No pending connection requests. When someone asks to join your network, they will appear here with
                    an accept option.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {incomingNetworkRequests.map((req) => (
                      <Card key={req.requestId} variant="outlined">
                        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ sm: "center" }}
                            spacing={1}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <CommunityAvatar initials={personInitials(req.from)} size={36} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {personLabel(req.from)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {req.from.email}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Box component="form" action={acceptNetworkRequestAction}>
                                <input type="hidden" name="requestId" value={req.requestId} />
                                <input type="hidden" name="redirectTo" value={networkActionRedirectTo} />
                                <Button
                                  type="submit"
                                  size="small"
                                  variant="contained"
                                  sx={communityContainedButtonSx()}
                                >
                                  Accept connection request
                                </Button>
                              </Box>
                              <Box component="form" action={declineNetworkRequestAction}>
                                <input type="hidden" name="requestId" value={req.requestId} />
                                <input type="hidden" name="redirectTo" value={networkActionRedirectTo} />
                                <Button
                                  type="submit"
                                  size="small"
                                  variant="outlined"
                                  sx={communityOutlinedButtonSx()}
                                >
                                  Decline
                                </Button>
                              </Box>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />
            </>
          ) : null}

          <Box>
            <Typography variant="subtitle2" sx={{ ...communitySectionTitleSx, fontSize: "0.875rem", mb: 1 }}>
              Network ({networkPeers.length})
            </Typography>
            {networkPeers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No mutual network connections yet. Send a request from someone&apos;s profile to connect.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {networkPeers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/community/profile/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                      <CommunityAvatar initials={personInitials(p)} size={36} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {personLabel(p)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {p.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ ...communitySectionTitleSx, fontSize: "0.875rem", mb: 1 }}>
              Followers ({followers.length})
            </Typography>
            {followers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No followers yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {followers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/community/profile/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                      <CommunityAvatar initials={personInitials(p)} size={36} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {personLabel(p)}
                          </Typography>
                          {p.isNewFollower ? (
                            <Chip label="New" size="small" color="error" variant="outlined" sx={{ height: 22 }} />
                          ) : null}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {p.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ ...communitySectionTitleSx, fontSize: "0.875rem", mb: 1 }}>
              Following ({following.length})
            </Typography>
            {following.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Not following anyone yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {following.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/community/profile/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                      <CommunityAvatar initials={personInitials(p)} size={36} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {personLabel(p)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {p.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Typography variant="h6" sx={{ ...communitySectionTitleSx, mb: 1.5 }}>
          Photos
        </Typography>
        {photos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No photos in posts yet.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 1.25,
            }}
          >
            {photos.map((ph) => (
              <Box
                key={ph.storage_path}
                component="img"
                src={ph.signedUrl}
                alt=""
                sx={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  borderRadius: 2,
                  display: "block",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 4px 16px -10px rgba(15, 23, 42, 0.12)",
                }}
              />
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Typography variant="h6" sx={{ ...communitySectionTitleSx, mb: 1 }}>
          Events
        </Typography>
        <Paper variant="outlined" sx={communitySurfacePaperSx({ mt: 0 })}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Facility meetups, webinars, and regional gatherings will show here.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coming soon — connect this tab to your events calendar or ticketing when you are ready.
          </Typography>
        </Paper>
      </TabPanel>
    </Paper>
  );
}
