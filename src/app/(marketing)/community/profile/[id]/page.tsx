import { notFound } from "next/navigation";

import { CommunityPageShell } from "@/components/community/CommunityPageShell";
import { CommunityProfileOtherCard } from "@/components/community/CommunityProfileOtherCard";
import { CommunityProfileSelfCard } from "@/components/community/CommunityProfileSelfCard";
import type { CommunityVendorSpotlight } from "@/components/community/CommunitySpotlightRail";
import { StatusToast, type StatusToastMessages } from "@/components/ui/StatusToast";
import { getUsersRowWithAdminFallback, requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import {
  canViewCommunityProfile,
  resolveCommunityViewer,
} from "@/lib/community/communityPartition";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import { communityProfilePath } from "@/lib/profile/paths";
import {
  CommunityProfileTabs,
  type ProfileTabPerson,
  type ProfileTabPhoto,
  type ProfileTabPost,
} from "@/components/community/CommunityProfileTabs";
import { type ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { isFollowingCommunityUser } from "@/lib/community/communityFollows";
import { signCommunityMediaPaths } from "@/lib/community/signMedia";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Community profile | Aquatics Empowered",
};

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

const COMMUNITY_PROFILE_TOAST_MESSAGES: StatusToastMessages = {
  bio_saved: { severity: "success", text: "Bio saved." },
  saved: { severity: "success", text: "Name saved." },
  avatar_saved: { severity: "success", text: "Profile photo updated." },
  avatar_removed: { severity: "success", text: "Profile photo removed." },
  invalid_file: { severity: "error", text: "Choose a JPEG, PNG, WebP, or GIF image (max 2 MB)." },
  file_too_large: { severity: "error", text: "Image must be 2 MB or smaller." },
  upload_error: {
    severity: "error",
    text: "Could not upload photo. Apply migration 0014_user_profile_fields.sql in Supabase if you have not yet.",
  },
  error: { severity: "error", text: "Could not save profile." },
  comment_invalid: { severity: "error", text: "Add a comment before submitting." },
  comment_error: { severity: "error", text: "Could not save that comment. Try again." },
  network_sent: { severity: "success", text: "Network connection request sent." },
  network_accepted: {
    severity: "success",
    text: "You are now connected in each other's network.",
  },
  network_declined: { severity: "info", text: "Connection request declined." },
  network_cancelled: { severity: "info", text: "Connection request withdrawn." },
  network_error: {
    severity: "error",
    text: "That network action could not be completed. Try again, or contact support if it keeps happening.",
  },
  network_schema: {
    severity: "error",
    text: "Network tables are missing on the server. In Supabase → SQL Editor, run the full script from migration file 0010_community_network_and_feed.sql (community requests + edges + RLS), then try again.",
  },
  network_rls: {
    severity: "error",
    text: "Your session does not match this community (org) in the database. Sign out and sign back in, or confirm both accounts belong to the same organization or the same global community.",
  },
  network_blocked: {
    severity: "info",
    text: "No request sent — you may already be connected, already have a pending request with this person, or they are outside your community.",
  },
  follow_blocked: {
    severity: "info",
    text: "You can't follow this member — they're outside your community partition.",
  },
  follow_error: {
    severity: "error",
    text: "Could not follow this member. In Supabase → SQL Editor, run supabase/scripts/RUN_THIS_community_org_global_follow.sql, then sign out and sign back in.",
  },
};

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
  searchParams: Promise<{ status?: string; tab?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { status, tab: tabParam, edit: editParam } = await searchParams;
  const profileInitialTab = tabParam === "connections" ? 1 : 0;
  const openEditOnLoad = editParam === "1";
  await requireViewAccess("community");
  const me = await requireProfileForApp();
  const viewer = await resolveCommunityViewer(me);

  const supabase = await createClient();
  const user = await getUsersRowWithAdminFallback(id);

  if (!user) {
    notFound();
  }

  const mayView = await canViewCommunityProfile(supabase, viewer, user);
  if (!mayView) {
    notFound();
  }

  const isSelf = me.id === id;
  const avatarUrl = await signAvatarPath(supabase, user.avatar_path);
  const profileRedirectPath = communityProfilePath(id);

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

  const isFollowing = await isFollowingCommunityUser(supabase, me.id, id);

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
  if (viewer.org_id) {
    postsQuery.or(`org_id.eq.${viewer.org_id},org_id.is.null`);
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
  const profileTitle = isSelf ? "Your profile" : breadcrumbName;
  const profileSubtitle = isSelf
    ? "Manage how others see you in the community — posts, connections, and photos."
    : `Member profile · ${user.email}`;

  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("id, name, tier, category, region")
    .eq("listing_visible", true)
    .order("name", { ascending: true })
    .limit(24);

  const vendorSpotlights = (vendorRows ?? []) as CommunityVendorSpotlight[];

  return (
    <CommunityPageShell
      eyebrow={isSelf ? "Connect · Share · Grow" : "Member · Community"}
      title={profileTitle}
      subtitle={profileSubtitle}
      vendors={vendorSpotlights}
      showSupportForm
    >
      <StatusToast status={status} messages={COMMUNITY_PROFILE_TOAST_MESSAGES} />

      {isSelf ? (
        <CommunityProfileSelfCard
          user={user}
          avatarUrl={avatarUrl}
          bio={prof?.bio ?? ""}
          followerCount={followerCount ?? 0}
          followingCount={followingCount ?? 0}
          initialEditOpen={openEditOnLoad}
        />
      ) : (
        <CommunityProfileOtherCard
          user={user}
          avatarUrl={avatarUrl}
          bio={prof?.bio ?? ""}
          followerCount={followerCount ?? 0}
          followingCount={followingCount ?? 0}
          isFollowing={isFollowing}
          inNetwork={inNetwork}
          pendingInRequestId={pendingInRequestId}
          pendingOutRequestId={pendingOutRequestId}
          profileRedirectPath={profileRedirectPath}
        />
      )}

      <CommunityProfileTabs
        profileOwner={{
          id: user.id,
          displayName: breadcrumbName,
          initials: breadcrumbName.slice(0, 2).toUpperCase(),
          avatarUrl,
          email: user.email,
        }}
        posts={tabPosts}
        followers={followers}
        following={following}
        networkPeers={tabNetwork}
        incomingNetworkRequests={incomingNetworkRequests}
        photos={tabPhotos}
        viewerId={me.id}
        commentsRedirectTo={profileRedirectPath}
        networkActionRedirectTo={profileRedirectPath}
        isSelfProfile={isSelf}
        connectionsTabBadgeCount={connectionsTabBadgeCount}
        unseenFollowerCount={unseenFollowerRows.length}
        initialTab={profileInitialTab}
      />
    </CommunityPageShell>
  );
}
