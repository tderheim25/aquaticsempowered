import type { SupabaseClient } from "@supabase/supabase-js";

import type { ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import type { CommunityVendorSpotlight } from "@/components/community/CommunitySpotlightRail";
import {
  DEMO_ORGANIZATION_SPOTLIGHTS,
  mapOrganizationRowToSpotlight,
  type CommunityOrganizationSpotlight,
} from "@/lib/community/organizationSpotlight";

import { signCommunityMediaPaths } from "./signMedia";

export type CommunityFeedViewer = { id: string; org_id: string | null };

export type LoadedCommunityFeed = {
  posts: { id: string; author_id: string; body: string; created_at: string }[];
  postsError: boolean;
  authorById: Map<string, { id: string; full_name: string | null; email: string }>;
  commentsByPost: Map<string, ResolvedPostComment[]>;
  mediaByPost: Map<string, { storage_path: string; sort_order: number }[]>;
  signedByPath: Map<string, string>;
  likeCountByPost: Map<string, number>;
  likedByMe: Set<string>;
  vendorSpotlights: CommunityVendorSpotlight[];
  organizationSpotlights: CommunityOrganizationSpotlight[];
};

/**
 * Loads feed posts, engagement, authors, optional comments, vendor rail.
 * Use `globalFeedOnly` for anonymous marketing previews (`org_id` is null — no org-internal posts).
 */
export async function loadCommunityFeedData(
  supabase: SupabaseClient,
  options: {
    viewer: CommunityFeedViewer | null;
    /** When true: only posts with `org_id IS NULL`. */
    globalFeedOnly: boolean;
    fetchLimit: number;
    sliceLimit: number;
    /** When false (e.g. quick preview), skip comment hydration. */
    includeComments?: boolean;
  }
): Promise<LoadedCommunityFeed> {
  const { viewer, globalFeedOnly, fetchLimit, sliceLimit, includeComments = true } = options;

  let followedIds = new Set<string>();
  if (viewer && !globalFeedOnly) {
    const { data: followsRows } = await supabase
      .from("community_follows")
      .select("followee_id")
      .eq("follower_id", viewer.id);
    followedIds = new Set((followsRows ?? []).map((r) => r.followee_id));
  }

  let postsQuery = supabase
    .from("community_posts")
    .select("id, author_id, body, created_at")
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (globalFeedOnly) {
    postsQuery = postsQuery.is("org_id", null);
  } else if (viewer?.org_id) {
    // Facility members see their org feed plus the global (org-less) community partition.
    postsQuery = postsQuery.or(`org_id.eq.${viewer.org_id},org_id.is.null`);
  } else {
    postsQuery = postsQuery.is("org_id", null);
  }

  let { data: posts, error: postsError } = await postsQuery;

  // Migration 0019 may not be applied yet on older databases.
  if (postsError && /moderation_status/i.test(postsError.message ?? "")) {
    let fallbackQuery = supabase
      .from("community_posts")
      .select("id, author_id, body, created_at")
      .order("created_at", { ascending: false })
      .limit(fetchLimit);
    if (globalFeedOnly) {
      fallbackQuery = fallbackQuery.is("org_id", null);
    } else if (viewer?.org_id) {
      fallbackQuery = fallbackQuery.or(`org_id.eq.${viewer.org_id},org_id.is.null`);
    } else {
      fallbackQuery = fallbackQuery.is("org_id", null);
    }
    const fallback = await fallbackQuery;
    posts = fallback.data;
    postsError = fallback.error;
  }

  const unsorted = [...(posts ?? [])];
  let postList: typeof unsorted;
  if (viewer && !globalFeedOnly) {
    postList = unsorted
      .sort((a, b) => {
        const af = followedIds.has(a.author_id) ? 0 : 1;
        const bf = followedIds.has(b.author_id) ? 0 : 1;
        if (af !== bf) return af - bf;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, sliceLimit);
  } else {
    postList = unsorted.slice(0, sliceLimit);
  }

  const postIds = postList.map((p) => p.id);
  const postAuthorIds = [...new Set(postList.map((p) => p.author_id))];

  let commentRows: { id: string; post_id: string; author_id: string; body: string; created_at: string }[] = [];
  if (includeComments && postIds.length > 0) {
    const commentsRes = await supabase
      .from("community_post_comments")
      .select("id, post_id, author_id, body, created_at")
      .eq("moderation_status", "visible")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });
    if (commentsRes.error && /moderation_status/i.test(commentsRes.error.message ?? "")) {
      const fallback = await supabase
        .from("community_post_comments")
        .select("id, post_id, author_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });
      commentRows = fallback.data ?? [];
    } else {
      commentRows = commentsRes.data ?? [];
    }
  }

  const commentAuthorIds = [...new Set((commentRows ?? []).map((c) => c.author_id))];
  const allAuthorIds = [...new Set([...postAuthorIds, ...commentAuthorIds])];

  const { data: authorRows } =
    allAuthorIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", allAuthorIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const authorById = new Map((authorRows ?? []).map((a) => [a.id, a]));

  const commentsByPost = new Map<string, ResolvedPostComment[]>();
  for (const row of commentRows ?? []) {
    const u = authorById.get(row.author_id);
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

  const mediaRows =
    postIds.length > 0
      ? (
          await supabase.from("community_post_media").select("post_id, storage_path, sort_order").in("post_id", postIds)
        ).data
      : [];

  const mediaByPost = new Map<string, { storage_path: string; sort_order: number }[]>();
  for (const m of mediaRows ?? []) {
    const list = mediaByPost.get(m.post_id) ?? [];
    list.push(m);
    mediaByPost.set(m.post_id, list);
  }
  for (const [, list] of mediaByPost) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const likeRows =
    postIds.length > 0
      ? (await supabase.from("community_likes").select("post_id, user_id").in("post_id", postIds)).data
      : [];

  const likeCountByPost = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCountByPost.set(row.post_id, (likeCountByPost.get(row.post_id) ?? 0) + 1);
    if (viewer && row.user_id === viewer.id) {
      likedByMe.add(row.post_id);
    }
  }

  const mediaPaths = (mediaRows ?? []).map((m) => m.storage_path);
  const signedByPath = await signCommunityMediaPaths(supabase, mediaPaths);

  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("id, name, tier, category, region")
    .eq("listing_visible", true)
    .order("name", { ascending: true })
    .limit(24);

  const vendorSpotlights = (vendorRows ?? []) as CommunityVendorSpotlight[];

  const { data: orgRows } = await supabase
    .from("organizations")
    .select("id, name, tier, plan_code, website_url, phone, founder")
    .order("name", { ascending: true })
    .limit(8);

  const organizationSpotlights =
    (orgRows ?? []).length > 0
      ? (orgRows ?? []).map((row) =>
          mapOrganizationRowToSpotlight(row, viewer?.org_id ?? null)
        )
      : DEMO_ORGANIZATION_SPOTLIGHTS;

  return {
    posts: postList,
    postsError: Boolean(postsError),
    authorById,
    commentsByPost,
    mediaByPost,
    signedByPath,
    likeCountByPost,
    likedByMe,
    vendorSpotlights,
    organizationSpotlights,
  };
}
