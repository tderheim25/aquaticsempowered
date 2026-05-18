import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunityProfileSelfSettings } from "@/components/community/CommunityProfileSelfSettings";
import { SetBreadcrumbLastLabel } from "@/components/dashboard/BreadcrumbLabelContext";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import {
  CommunityProfileTabs,
  type ProfileTabPerson,
  type ProfileTabPhoto,
  type ProfileTabPost,
} from "@/components/community/CommunityProfileTabs";
import { type ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { signCommunityMediaPaths } from "@/lib/community/signMedia";
import { createClient } from "@/lib/supabase/server";

import {
  acceptNetworkRequestAction,
  cancelNetworkRequestAction,
  declineNetworkRequestAction,
  followUserAction,
  sendNetworkRequestAction,
  unfollowUserAction,
} from "../../actions";

function displayName(u: {
  full_name: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}) {
  return buildDisplayName({
    first_name: u.first_name,
    last_name: u.last_name,
    full_name: u.full_name,
    email: u.email,
  });
}

function initials(u: {
  full_name: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}) {
  return displayName(u).slice(0, 2).toUpperCase();
}

function profileStatusMessage(status?: string) {
  switch (status) {
    case "bio_saved":
      return { severity: "success" as const, text: "Bio saved." };
    case "saved":
      return { severity: "success" as const, text: "Name saved." };
    case "avatar_saved":
      return { severity: "success" as const, text: "Profile photo updated." };
    case "avatar_removed":
      return { severity: "success" as const, text: "Profile photo removed." };
    case "invalid_file":
      return { severity: "error" as const, text: "Choose a JPEG, PNG, WebP, or GIF image (max 2 MB)." };
    case "file_too_large":
      return { severity: "error" as const, text: "Image must be 2 MB or smaller." };
    case "upload_error":
      return {
        severity: "error" as const,
        text: "Could not upload photo. Apply migration 0014_user_profile_fields.sql in Supabase if you have not yet.",
      };
    case "error":
      return { severity: "error" as const, text: "Could not save profile." };
    case "comment_invalid":
      return { severity: "error" as const, text: "Add a comment before submitting." };
    case "comment_error":
      return { severity: "error" as const, text: "Could not save that comment. Try again." };
    case "network_sent":
      return { severity: "success" as const, text: "Network connection request sent." };
    case "network_accepted":
      return { severity: "success" as const, text: "You are now connected in each other's network." };
    case "network_declined":
      return { severity: "info" as const, text: "Connection request declined." };
    case "network_cancelled":
      return { severity: "info" as const, text: "Connection request withdrawn." };
    case "network_error":
      return {
        severity: "error" as const,
        text: "That network action could not be completed. Try again, or contact support if it keeps happening.",
      };
    case "network_schema":
      return {
        severity: "error" as const,
        text:
          "Network tables are missing on the server. In Supabase → SQL Editor, run the full script from migration file 0010_community_network_and_feed.sql (community requests + edges + RLS), then try again.",
      };
    case "network_rls":
      return {
        severity: "error" as const,
        text:
          "Your session does not match this community (org) in the database. Sign out and sign back in, or confirm both accounts belong to the same organization or the same global community.",
      };
    case "network_blocked":
      return {
        severity: "info" as const,
        text: "No request sent — you may already be connected, already have a pending request with this person, or they are outside your community.",
      };
    default:
      return null;
  }
}

function sortPeople(a: ProfileTabPerson, b: ProfileTabPerson) {
  const la = (a.full_name?.trim() || a.email).toLowerCase();
  const lb = (b.full_name?.trim() || b.email).toLowerCase();
  return la.localeCompare(lb);
}

export default async function CommunityProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  const flash = profileStatusMessage(status);

  await requireViewAccess("community");
  const me = await requireProfileForApp();

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, email, org_id, first_name, last_name, avatar_path")
    .eq("id", id)
    .maybeSingle();

  if (!user) {
    notFound();
  }
  const sameOrgFeed =
    Boolean(me.org_id) && Boolean(user.org_id) && me.org_id === user.org_id;
  const sameGlobalFeed = !me.org_id && !user.org_id;
  if (!sameOrgFeed && !sameGlobalFeed) {
    notFound();
  }

  const isSelf = me.id === id;
  const avatarUrl = await signAvatarPath(supabase, user.avatar_path);

  const { data: prof } = await supabase
    .from("community_profiles")
    .select("bio, last_connections_activity_seen_at")
    .eq("user_id", id)
    .maybeSingle();

  const { count: followerCount } = await supabase
    .from("community_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("followee_id", id);

  const { count: followingCount } = await supabase
    .from("community_follows")
    .select("followee_id", { count: "exact", head: true })
    .eq("follower_id", id);

  const { data: followingRow } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", me.id)
    .eq("followee_id", id)
    .maybeSingle();

  const isFollowing = Boolean(followingRow);

  const lowerPair = me.id < id ? me.id : id;
  const upperPair = me.id < id ? id : me.id;
  const { data: netEdge } = await supabase
    .from("community_network_edges")
    .select("user_a")
    .eq("user_a", lowerPair)
    .eq("user_b", upperPair)
    .maybeSingle();
  const inNetwork = Boolean(netEdge);

  const { data: pendingOutRow } = await supabase
    .from("community_network_requests")
    .select("id")
    .eq("requester_id", me.id)
    .eq("addressee_id", id)
    .eq("status", "pending")
    .maybeSingle();
  const pendingOutRequestId = pendingOutRow?.id ?? null;

  const { data: pendingInRow } = await supabase
    .from("community_network_requests")
    .select("id")
    .eq("requester_id", id)
    .eq("addressee_id", me.id)
    .eq("status", "pending")
    .maybeSingle();
  const pendingInRequestId = pendingInRow?.id ?? null;

  const postsQuery = supabase
    .from("community_posts")
    .select("id, body, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (me.org_id) {
    postsQuery.eq("org_id", me.org_id);
  } else {
    postsQuery.is("org_id", null);
  }
  const { data: posts } = await postsQuery;

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: mediaRows } =
    postIds.length > 0
      ? await supabase.from("community_post_media").select("post_id, storage_path, sort_order").in("post_id", postIds)
      : { data: [] as { post_id: string; storage_path: string; sort_order: number }[] };

  const mediaByPost = new Map<string, { storage_path: string }[]>();
  for (const m of mediaRows ?? []) {
    const list = mediaByPost.get(m.post_id) ?? [];
    list.push({ storage_path: m.storage_path });
    mediaByPost.set(m.post_id, list);
  }

  const profileRedirectPath = `/app/community/profile/${id}`;
  const profileMediaPaths = (mediaRows ?? []).map((m) => m.storage_path);
  const signedByPath = await signCommunityMediaPaths(supabase, profileMediaPaths);

  const { data: commentRows } =
    postIds.length > 0
      ? await supabase
          .from("community_post_comments")
          .select("id, post_id, author_id, body, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : { data: [] as { id: string; post_id: string; author_id: string; body: string; created_at: string }[] };

  const commentAuthorIds = [...new Set((commentRows ?? []).map((c) => c.author_id))];
  const { data: commentAuthorUsers } =
    commentAuthorIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", commentAuthorIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const commentAuthorById = new Map((commentAuthorUsers ?? []).map((u) => [u.id, u]));

  const commentsByPost = new Map<string, ResolvedPostComment[]>();
  for (const row of commentRows ?? []) {
    const u = commentAuthorById.get(row.author_id);
    const list = commentsByPost.get(row.post_id) ?? [];
    list.push({
      id: row.id,
      author_id: row.author_id,
      body: row.body,
      created_at: row.created_at,
      author_display: u?.full_name?.trim() ?? "",
      author_email: u?.email ?? "",
    });
    commentsByPost.set(row.post_id, list);
  }

  const { data: followerFollows } = await supabase
    .from("community_follows")
    .select("follower_id, created_at")
    .eq("followee_id", id);
  const followerIds = [...new Set((followerFollows ?? []).map((r) => r.follower_id))];
  const { data: followerUserRows } =
    followerIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", followerIds)
      : { data: [] as ProfileTabPerson[] };

  const lastConnectionsSeenAt = prof?.last_connections_activity_seen_at ?? null;
  const followCreatedByFollowerId = new Map((followerFollows ?? []).map((r) => [r.follower_id, r.created_at]));

  const { data: followingFollows } = await supabase.from("community_follows").select("followee_id").eq("follower_id", id);
  const followingIds = [...new Set((followingFollows ?? []).map((r) => r.followee_id))];
  const { data: followingUserRows } =
    followingIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", followingIds)
      : { data: [] as ProfileTabPerson[] };

  const followers = [...(followerUserRows ?? [])]
    .map((u) => {
      const fc = followCreatedByFollowerId.get(u.id);
      return {
        ...u,
        isNewFollower:
          isSelf &&
          !!lastConnectionsSeenAt &&
          !!fc &&
          new Date(fc) > new Date(lastConnectionsSeenAt),
      };
    })
    .sort(sortPeople);
  const following = [...(followingUserRows ?? [])].sort(sortPeople);

  const { data: edgeRows } = await supabase
    .from("community_network_edges")
    .select("user_a, user_b")
    .or(`user_a.eq.${id},user_b.eq.${id}`);
  const peerIds = [...new Set((edgeRows ?? []).map((e) => (e.user_a === id ? e.user_b : e.user_a)))];
  const { data: networkUserRows } =
    peerIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", peerIds)
      : { data: [] as ProfileTabPerson[] };
  const tabNetwork = [...(networkUserRows ?? [])].sort(sortPeople);

  const { data: incomingReqRows } = isSelf
    ? await supabase
        .from("community_network_requests")
        .select("id, requester_id")
        .eq("addressee_id", me.id)
        .eq("status", "pending")
    : { data: [] as { id: string; requester_id: string }[] };

  const incomingRequesterIds = [...new Set((incomingReqRows ?? []).map((r) => r.requester_id))];
  const { data: incomingRequesterUsers } =
    incomingRequesterIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", incomingRequesterIds)
      : { data: [] as ProfileTabPerson[] };
  const incomingById = new Map((incomingRequesterUsers ?? []).map((u) => [u.id, u]));
  const incomingNetworkRequests = (incomingReqRows ?? []).map((r) => ({
    requestId: r.id,
    from: (incomingById.get(r.requester_id) ?? {
      id: r.requester_id,
      full_name: null,
      email: "",
    }) as ProfileTabPerson,
  }));

  const unseenFollowerRows = isSelf
    ? (followerFollows ?? []).filter(
        (r) =>
          !lastConnectionsSeenAt || new Date(r.created_at) > new Date(lastConnectionsSeenAt)
      )
    : [];
  const connectionsTabBadgeCount = isSelf
    ? incomingNetworkRequests.length + unseenFollowerRows.length
    : 0;

  const tabPosts: ProfileTabPost[] = (posts ?? []).map((post) => ({
    id: post.id,
    body: post.body,
    created_at: post.created_at,
    images: (mediaByPost.get(post.id) ?? [])
      .map((im) => {
        const signedUrl = signedByPath.get(im.storage_path);
        return signedUrl ? { storage_path: im.storage_path, signedUrl } : null;
      })
      .filter((x): x is { storage_path: string; signedUrl: string } => x !== null),
    comments: commentsByPost.get(post.id) ?? [],
  }));

  const tabPhotos: ProfileTabPhoto[] = [];
  for (const p of tabPosts) {
    for (const img of p.images) {
      tabPhotos.push({ storage_path: img.storage_path, signedUrl: img.signedUrl });
    }
  }

  const breadcrumbName = displayName(user);

  return (
    <Container maxWidth="md">
    <SetBreadcrumbLastLabel label={breadcrumbName} />
    <Stack spacing={2}>
      <Button component={Link} href="/community" variant="text" sx={{ alignSelf: "flex-start" }}>
        ← Back to feed
      </Button>

      {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {isSelf ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              Your profile
            </Typography>
            <CommunityProfileSelfSettings
              user={user}
              avatarUrl={avatarUrl}
              bio={prof?.bio ?? ""}
              followerCount={followerCount ?? 0}
              followingCount={followingCount ?? 0}
            />
          </>
        ) : (
        <>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
          <Avatar
            src={avatarUrl ?? undefined}
            sx={{ width: 72, height: 72, fontSize: "1.5rem", bgcolor: "primary.main" }}
          >
            {initials(user)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {displayName(user)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>{followerCount ?? 0}</strong> followers
              </Typography>
              <Typography variant="body2">
                <strong>{followingCount ?? 0}</strong> following
              </Typography>
            </Stack>

              <Stack spacing={1.5} sx={{ mt: 2 }} alignItems="flex-start">
                {isFollowing ? (
                  <Box component="form" action={unfollowUserAction}>
                    <input type="hidden" name="followeeId" value={id} />
                    <Button type="submit" variant="outlined" color="inherit">
                      Following
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" action={followUserAction}>
                    <Stack spacing={1} alignItems="flex-start">
                      <input type="hidden" name="followeeId" value={id} />
                      <Button type="submit" variant="contained">
                        Follow
                      </Button>
                      <FormControlLabel
                        control={<Checkbox name="alsoNetwork" value="1" size="small" />}
                        label="Also send a network connection request"
                      />
                    </Stack>
                  </Box>
                )}

                {inNetwork ? (
                  <Chip label="In your network" color="success" size="small" variant="outlined" />
                ) : null}

                {!inNetwork && pendingInRequestId ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {displayName(user)} invited you to connect.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Box component="form" action={acceptNetworkRequestAction}>
                        <input type="hidden" name="requestId" value={pendingInRequestId} />
                        <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                        <Button type="submit" size="small" variant="contained">
                          Accept
                        </Button>
                      </Box>
                      <Box component="form" action={declineNetworkRequestAction}>
                        <input type="hidden" name="requestId" value={pendingInRequestId} />
                        <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                        <Button type="submit" size="small" variant="outlined" color="inherit">
                          Decline
                        </Button>
                      </Box>
                    </Stack>
                  </Stack>
                ) : null}

                {!inNetwork && !pendingInRequestId && pendingOutRequestId ? (
                  <Box component="form" action={cancelNetworkRequestAction}>
                    <input type="hidden" name="requestId" value={pendingOutRequestId} />
                    <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                    <Button type="submit" variant="outlined" color="inherit" size="small">
                      Cancel request
                    </Button>
                  </Box>
                ) : null}

                {!inNetwork && !pendingInRequestId && !pendingOutRequestId && isFollowing ? (
                  <Box component="form" action={sendNetworkRequestAction}>
                    <input type="hidden" name="addresseeId" value={id} />
                    <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                    <Button type="submit" variant="outlined" size="small">
                      Request network connection
                    </Button>
                  </Box>
                ) : null}
              </Stack>
          </Box>
        </Stack>

        {prof?.bio ? (
          <Typography variant="body2" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {prof.bio}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No bio yet.
          </Typography>
        )}
        </>
        )}
      </Paper>

      <CommunityProfileTabs
        posts={tabPosts}
        followers={followers}
        following={following}
        networkPeers={tabNetwork}
        incomingNetworkRequests={incomingNetworkRequests}
        photos={tabPhotos}
        viewerId={me.id}
        commentsRedirectTo={`/app/community/profile/${id}`}
        networkActionRedirectTo={profileRedirectPath}
        isSelfProfile={isSelf}
        connectionsTabBadgeCount={connectionsTabBadgeCount}
        unseenFollowerCount={unseenFollowerRows.length}
      />
    </Stack>
    </Container>
  );
}
