"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { deleteCommunityPostAction } from "@/app/(dashboard)/app/community/actions";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";
import type { SerializedFeedEngagement } from "@/lib/community/serializeFeedEngagement";
import { useCommunityPostEngagement } from "@/lib/community/useCommunityPostEngagement";

import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityPostCommentsBlock } from "./CommunityPostCommentsBlock";
import { CommunityPostImages } from "./CommunityPostImages";
import { CommunityPostLikeButton } from "./CommunityPostLikeButton";

const COMMUNITY_FEED_PATH = "/community";

type Post = { id: string; author_id: string; body: string; created_at: string };
type Author = { id: string; full_name: string | null; email: string };

function displayName(u: Author) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

function initials(u: Author) {
  return displayName(u).slice(0, 2).toUpperCase();
}

function truncateBody(body: string, max: number) {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function CommunityFeedPostsLive({
  variant,
  previewBodyMaxChars,
  viewer,
  canInteract,
  posts,
  authors,
  mediaByPost,
  signedByPath,
  engagement,
}: {
  variant: "full" | "preview";
  previewBodyMaxChars: number;
  viewer: { id: string; org_id: string | null } | null;
  canInteract: boolean;
  posts: Post[];
  authors: Record<string, Author>;
  mediaByPost: Record<string, { storage_path: string; sort_order: number }[]>;
  signedByPath: Record<string, string>;
  engagement: SerializedFeedEngagement;
}) {
  const postIds = posts.map((p) => p.id);
  const live = variant === "full" && canInteract && viewer;
  const {
    getComments,
    getLikeCount,
    isLiked,
    appendComment,
    removeComment,
    setLikeState,
  } = useCommunityPostEngagement(Boolean(live), postIds, engagement, live ? viewer!.id : null);

  const profileHrefForAuthor = (authorId: string) => `/app/community/profile/${authorId}`;
  const loginForProfileHref = (authorId: string) =>
    `/login?next=${encodeURIComponent(profileHrefForAuthor(authorId))}`;

  return (
    <Stack spacing={2}>
      {posts.map((post) => {
        const author = authors[post.author_id];
        const media = mediaByPost[post.id] ?? [];
        const likes = live ? getLikeCount(post.id) : (engagement.likeCountByPost[post.id] ?? 0);
        const liked = live ? isLiked(post.id) : engagement.likedByMe.includes(post.id);
        const comments = live ? getComments(post.id) : (engagement.commentsByPost[post.id] ?? []);
        const name = author ? displayName(author) : "Member";
        const sub = author?.email ?? "";
        const bodyText =
          variant === "preview" ? truncateBody(post.body || "", previewBodyMaxChars) : post.body || "";
        const profileLink = canInteract ? profileHrefForAuthor(post.author_id) : loginForProfileHref(post.author_id);

        return (
          <Card key={post.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Link href={profileLink} style={{ textDecoration: "none" }}>
                  <CommunityAvatar initials={author ? initials(author) : "?"} size={40} />
                </Link>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography
                        component={Link}
                        href={profileLink}
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none" }}
                      >
                        {name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCommunityTimestamp(post.created_at)} · {sub}
                      </Typography>
                    </Box>
                    {variant === "full" && canInteract && viewer && post.author_id === viewer.id ? (
                      <Box component="form" action={deleteCommunityPostAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="small" color="error">
                          Delete
                        </Button>
                      </Box>
                    ) : null}
                  </Stack>

                  {bodyText ? (
                    <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                      {bodyText}
                    </Typography>
                  ) : null}

                  {variant === "preview" && (post.body?.length ?? 0) > previewBodyMaxChars ? (
                    <Typography variant="caption" color="primary" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                      <Link href="/login?next=%2Fcommunity" style={{ color: "inherit", textDecoration: "underline" }}>
                        Sign in to read the rest
                      </Link>
                    </Typography>
                  ) : null}

                  {media.length > 0 ? (
                    <CommunityPostImages
                      images={media
                        .map((m) => {
                          const src = signedByPath[m.storage_path];
                          if (!src) return null;
                          return { id: m.storage_path, src, alt: "Post image" };
                        })
                        .filter((item): item is { id: string; src: string; alt: string } => item !== null)}
                    />
                  ) : null}

                  <Divider sx={{ my: 1.5 }} />

                  {variant === "full" && canInteract && viewer ? (
                    <CommunityPostCommentsBlock
                      postId={post.id}
                      viewerId={viewer.id}
                      comments={comments}
                      redirectTo={COMMUNITY_FEED_PATH}
                      liveUpdates={Boolean(live)}
                      onCommentAdded={(c) => appendComment(post.id, c)}
                      onCommentRemoved={(commentId) => removeComment(commentId, post.id)}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      <Link href="/login?next=%2Fcommunity" style={{ fontWeight: 600, textDecoration: "none" }}>
                        Sign in to view comments and join the thread
                      </Link>
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    {variant === "full" && canInteract && viewer ? (
                      live ? (
                        <CommunityPostLikeButton
                          postId={post.id}
                          liked={liked}
                          count={likes}
                          onToggled={(nextLiked, nextCount) => setLikeState(post.id, nextLiked, nextCount)}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {likes} {likes === 1 ? "like" : "likes"}
                        </Typography>
                      )
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {likes} {likes === 1 ? "like" : "likes"}
                      </Typography>
                    )}
                    <Button size="small" component={Link} href={profileLink}>
                      {canInteract ? "View profile" : "Sign in to view profile"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
