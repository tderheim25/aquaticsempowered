import type { SupabaseClient } from "@supabase/supabase-js";

import { communityProfilePath } from "@/lib/profile/paths";

export type CommunityActivityItem =
  | {
      kind: "connection_request";
      id: string;
      requesterId: string;
      requesterName: string;
      createdAt: string;
      href: string;
    }
  | {
      kind: "new_follower";
      id: string;
      followerId: string;
      followerName: string;
      createdAt: string;
      href: string;
    }
  | {
      kind: "post_comment";
      id: string;
      postId: string;
      authorId: string;
      authorName: string;
      postPreview: string;
      commentPreview: string;
      createdAt: string;
      href: string;
    }
  | {
      kind: "post_like";
      id: string;
      postId: string;
      likerId: string;
      likerName: string;
      postPreview: string;
      createdAt: string;
      href: string;
    };

export type CommunityActivitySummary = {
  total: number;
  connectionRequestCount: number;
  newFollowerCount: number;
  postCommentCount: number;
  postLikeCount: number;
  items: CommunityActivityItem[];
  connectionsHref: string;
  communityFeedHref: string;
};

function personLabel(u: { full_name: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

function truncate(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function isAfter(iso: string, lastSeen: string | null) {
  if (!lastSeen) return true;
  return new Date(iso) > new Date(lastSeen);
}

export async function loadCommunityActivitySummary(
  supabase: SupabaseClient,
  profileId: string
): Promise<CommunityActivitySummary> {
  const connectionsHref = `${communityProfilePath(profileId)}?tab=connections`;
  const communityFeedHref = "/community";

  const { data: prof } = await supabase
    .from("community_profiles")
    .select("last_connections_activity_seen_at")
    .eq("user_id", profileId)
    .maybeSingle();

  const lastSeen = prof?.last_connections_activity_seen_at ?? null;

  const { data: incomingReqRows } = await supabase
    .from("community_network_requests")
    .select("id, requester_id, created_at")
    .eq("addressee_id", profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: followerFollows } = await supabase
    .from("community_follows")
    .select("follower_id, created_at")
    .eq("followee_id", profileId)
    .order("created_at", { ascending: false });

  const unseenFollowers = (followerFollows ?? []).filter((r) => isAfter(r.created_at, lastSeen));

  const { data: commentRows } = await supabase
    .from("community_post_comments")
    .select(
      `id, post_id, author_id, body, created_at,
       community_posts!inner ( id, author_id, body )`
    )
    .eq("community_posts.author_id", profileId)
    .neq("author_id", profileId)
    .order("created_at", { ascending: false })
    .limit(40);

  const unseenComments = (commentRows ?? []).filter((r) => isAfter(r.created_at, lastSeen));

  const { data: likeRows } = await supabase
    .from("community_likes")
    .select(
      `post_id, user_id, created_at,
       community_posts!inner ( id, author_id, body )`
    )
    .eq("community_posts.author_id", profileId)
    .neq("user_id", profileId)
    .order("created_at", { ascending: false })
    .limit(40);

  const unseenLikes = (likeRows ?? []).filter((r) => isAfter(r.created_at, lastSeen));

  const userIds = [
    ...new Set([
      ...(incomingReqRows ?? []).map((r) => r.requester_id),
      ...unseenFollowers.map((r) => r.follower_id),
      ...unseenComments.map((r) => r.author_id),
      ...unseenLikes.map((r) => r.user_id),
    ]),
  ];

  const { data: userRows } =
    userIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const userById = new Map((userRows ?? []).map((u) => [u.id, u]));

  type PostJoin = { id: string; author_id: string; body: string | null };
  const postFromComment = (row: { community_posts: PostJoin | PostJoin[] }) => {
    const p = row.community_posts;
    return Array.isArray(p) ? p[0] : p;
  };

  const items: CommunityActivityItem[] = [
    ...(incomingReqRows ?? []).map((r) => {
      const u = userById.get(r.requester_id);
      return {
        kind: "connection_request" as const,
        id: r.id,
        requesterId: r.requester_id,
        requesterName: u ? personLabel(u) : "Member",
        createdAt: r.created_at,
        href: connectionsHref,
      };
    }),
    ...unseenFollowers.map((r) => {
      const u = userById.get(r.follower_id);
      return {
        kind: "new_follower" as const,
        id: r.follower_id,
        followerId: r.follower_id,
        followerName: u ? personLabel(u) : "Member",
        createdAt: r.created_at,
        href: connectionsHref,
      };
    }),
    ...unseenComments.map((r) => {
      const u = userById.get(r.author_id);
      const post = postFromComment(r as { community_posts: PostJoin | PostJoin[] });
      return {
        kind: "post_comment" as const,
        id: r.id,
        postId: r.post_id,
        authorId: r.author_id,
        authorName: u ? personLabel(u) : "Member",
        postPreview: truncate(post?.body ?? "", 60),
        commentPreview: truncate(r.body ?? "", 80),
        createdAt: r.created_at,
        href: communityFeedHref,
      };
    }),
    ...unseenLikes.map((r) => {
      const u = userById.get(r.user_id);
      const post = postFromComment(r as { community_posts: PostJoin | PostJoin[] });
      return {
        kind: "post_like" as const,
        id: `${r.post_id}:${r.user_id}`,
        postId: r.post_id,
        likerId: r.user_id,
        likerName: u ? personLabel(u) : "Member",
        postPreview: truncate(post?.body ?? "", 60),
        createdAt: r.created_at,
        href: communityFeedHref,
      };
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const connectionRequestCount = incomingReqRows?.length ?? 0;
  const newFollowerCount = unseenFollowers.length;
  const postCommentCount = unseenComments.length;
  const postLikeCount = unseenLikes.length;

  return {
    total: connectionRequestCount + newFollowerCount + postCommentCount + postLikeCount,
    connectionRequestCount,
    newFollowerCount,
    postCommentCount,
    postLikeCount,
    items,
    connectionsHref,
    communityFeedHref,
  };
}
