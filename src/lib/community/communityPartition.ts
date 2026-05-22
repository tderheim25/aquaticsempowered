import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import type { UsersRow } from "@/lib/auth/rbac";

export type CommunityViewer = { id: string; org_id: string | null };

/** Org used for community feed/profile partition (includes super-admin org cookie). */
export async function resolveCommunityViewer(profile: UsersRow): Promise<CommunityViewer> {
  const org_id = await resolveActiveOrgId(profile, null);
  return { id: profile.id, org_id };
}

export function isSameCommunityPartition(
  viewerOrgId: string | null,
  targetOrgId: string | null
): boolean {
  if (viewerOrgId && targetOrgId) return viewerOrgId === targetOrgId;
  if (!viewerOrgId && !targetOrgId) return true;
  return false;
}

/** Network edge or follow in either direction (community graph). */
export async function hasCommunitySocialLink(
  supabase: SupabaseClient,
  viewerId: string,
  targetId: string
): Promise<boolean> {
  const lowerPair = viewerId < targetId ? viewerId : targetId;
  const upperPair = viewerId < targetId ? targetId : viewerId;

  const { data: edge } = await supabase
    .from("community_network_edges")
    .select("user_a")
    .eq("user_a", lowerPair)
    .eq("user_b", upperPair)
    .maybeSingle();
  if (edge) return true;

  const { data: followOut } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("followee_id", targetId)
    .maybeSingle();
  if (followOut) return true;

  const { data: followIn } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", targetId)
    .eq("followee_id", viewerId)
    .maybeSingle();
  return Boolean(followIn);
}

export async function canViewCommunityProfile(
  supabase: SupabaseClient,
  viewer: CommunityViewer,
  target: Pick<UsersRow, "id" | "org_id">
): Promise<boolean> {
  if (viewer.id === target.id) return true;
  if (isSameCommunityPartition(viewer.org_id, target.org_id ?? null)) return true;
  return hasCommunitySocialLink(supabase, viewer.id, target.id);
}
