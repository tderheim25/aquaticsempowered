"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CommunityPostCommentsBlock, type ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";
import {
  acceptNetworkRequestAction,
  declineNetworkRequestAction,
  markCommunityConnectionsSeenAction,
} from "@/app/(dashboard)/app/community/actions";

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
    <Box role="tabpanel" id={`profile-tabpanel-${index}`} sx={{ pt: 2 }} aria-labelledby={`profile-tab-${index}`}>
      {children}
    </Box>
  );
}

export function CommunityProfileTabs({
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
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider" }}
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
        {posts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No posts yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {posts.map((post) => (
              <Card key={post.id} variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {formatCommunityTimestamp(post.created_at)}
                  </Typography>
                  {post.body ? (
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                      {post.body}
                    </Typography>
                  ) : null}
                  {post.images.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {post.images.map((img) => (
                        <Box
                          key={img.storage_path}
                          component="img"
                          src={img.signedUrl}
                          alt=""
                          sx={{ maxWidth: 240, maxHeight: 180, borderRadius: 1, objectFit: "cover" }}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  <Divider sx={{ mt: 1.5 }} />

                  <CommunityPostCommentsBlock
                    postId={post.id}
                    viewerId={viewerId}
                    comments={post.comments}
                    redirectTo={commentsRedirectTo}
                  />
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Stack spacing={3}>
          {isSelfProfile ? (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
                              <Avatar sx={{ width: 36, height: 36 }}>{personInitials(req.from)}</Avatar>
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
                                <Button type="submit" size="small" variant="contained">
                                  Accept connection request
                                </Button>
                              </Box>
                              <Box component="form" action={declineNetworkRequestAction}>
                                <input type="hidden" name="requestId" value={req.requestId} />
                                <input type="hidden" name="redirectTo" value={networkActionRedirectTo} />
                                <Button type="submit" size="small" variant="outlined" color="inherit">
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
                      <Avatar sx={{ width: 36, height: 36 }}>{personInitials(p)}</Avatar>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
                      <Avatar sx={{ width: 36, height: 36 }}>{personInitials(p)}</Avatar>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
                      <Avatar sx={{ width: 36, height: 36 }}>{personInitials(p)}</Avatar>
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
        {photos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No photos in posts yet.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 1,
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
                  borderRadius: 1,
                  display: "block",
                }}
              />
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Facility meetups, webinars, and regional gatherings will show here.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Coming soon — connect this tab to your events calendar or ticketing when you are ready.
        </Typography>
      </TabPanel>
    </Box>
  );
}
