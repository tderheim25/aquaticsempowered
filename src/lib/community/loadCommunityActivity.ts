import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityActivityItem =
  | {
      kind: "connection_request";
      id: string;
      requesterId: string;
      requesterName: string;
      createdAt: string;
    }
  | {
      kind: "new_follower";
      id: string;
      followerId: string;
      followerName: string;
      createdAt: string;
    };

export type CommunityActivitySummary = {
  total: number;
  connectionRequestCount: number;
  newFollowerCount: number;
  items: CommunityActivityItem[];
  connectionsHref: string;
};

function personLabel(u: { full_name: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

export async function loadCommunityActivitySummary(
  supabase: SupabaseClient,
  profileId: string
): Promise<CommunityActivitySummary> {
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

  const unseenFollowers = (followerFollows ?? []).filter(
    (r) => !lastSeen || new Date(r.created_at) > new Date(lastSeen)
  );

  const userIds = [
    ...new Set([
      ...(incomingReqRows ?? []).map((r) => r.requester_id),
      ...unseenFollowers.map((r) => r.follower_id),
    ]),
  ];

  const { data: userRows } =
    userIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const userById = new Map((userRows ?? []).map((u) => [u.id, u]));

  const items: CommunityActivityItem[] = [
    ...(incomingReqRows ?? []).map((r) => {
      const u = userById.get(r.requester_id);
      return {
        kind: "connection_request" as const,
        id: r.id,
        requesterId: r.requester_id,
        requesterName: u ? personLabel(u) : "Member",
        createdAt: r.created_at,
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
      };
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const connectionRequestCount = incomingReqRows?.length ?? 0;
  const newFollowerCount = unseenFollowers.length;

  return {
    total: connectionRequestCount + newFollowerCount,
    connectionRequestCount,
    newFollowerCount,
    items,
    connectionsHref: `/app/community/profile/${profileId}?tab=connections`,
  };
}
