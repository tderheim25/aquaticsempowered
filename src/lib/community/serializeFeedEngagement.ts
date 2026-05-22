import type { ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import type { CommunityVendorSpotlight } from "@/components/community/CommunitySpotlightRail";
import type { CommunityOrganizationSpotlight } from "@/lib/community/organizationSpotlight";
import type { LoadedCommunityFeed } from "@/lib/community/loadCommunityFeedData";

/** JSON-serializable feed for client `CommunityFeedPanel` (avoids RSC Map props + MUI useId drift). */
export type SerializedCommunityFeed = {
  posts: LoadedCommunityFeed["posts"];
  postsError: boolean;
  authorById: Record<string, { id: string; full_name: string | null; email: string }>;
  commentsByPost: Record<string, ResolvedPostComment[]>;
  mediaByPost: Record<string, { storage_path: string; sort_order: number }[]>;
  signedByPath: Record<string, string>;
  likeCountByPost: Record<string, number>;
  likedByMe: string[];
  vendorSpotlights: CommunityVendorSpotlight[];
  organizationSpotlights: CommunityOrganizationSpotlight[];
};

export function serializeLoadedCommunityFeed(feed: LoadedCommunityFeed): SerializedCommunityFeed {
  const commentsByPost: Record<string, ResolvedPostComment[]> = {};
  for (const [postId, list] of feed.commentsByPost) {
    commentsByPost[postId] = list;
  }
  const mediaByPost: Record<string, { storage_path: string; sort_order: number }[]> = {};
  for (const [postId, list] of feed.mediaByPost) {
    mediaByPost[postId] = list;
  }
  return {
    posts: feed.posts,
    postsError: feed.postsError,
    authorById: Object.fromEntries(feed.authorById),
    commentsByPost,
    mediaByPost,
    signedByPath: Object.fromEntries(feed.signedByPath),
    likeCountByPost: Object.fromEntries(feed.likeCountByPost),
    likedByMe: [...feed.likedByMe],
    vendorSpotlights: feed.vendorSpotlights,
    organizationSpotlights: feed.organizationSpotlights,
  };
}

export type SerializedFeedEngagement = {
  commentsByPost: Record<string, ResolvedPostComment[]>;
  likeCountByPost: Record<string, number>;
  likedByMe: string[];
};

export function serializeFeedEngagement(
  feed: Pick<SerializedCommunityFeed, "commentsByPost" | "likeCountByPost" | "likedByMe">
): SerializedFeedEngagement {
  return {
    commentsByPost: feed.commentsByPost,
    likeCountByPost: feed.likeCountByPost,
    likedByMe: feed.likedByMe,
  };
}

export function engagementFromProfilePosts(
  posts: { id: string; comments: ResolvedPostComment[] }[],
  likeCountByPost: Record<string, number> = {},
  likedByMe: string[] = []
): SerializedFeedEngagement {
  const commentsByPost: Record<string, ResolvedPostComment[]> = {};
  for (const p of posts) {
    commentsByPost[p.id] = p.comments;
  }
  return { commentsByPost, likeCountByPost, likedByMe };
}
