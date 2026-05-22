"use client";

import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { engagementFromProfilePosts } from "@/lib/community/serializeFeedEngagement";
import { useCommunityPostEngagement } from "@/lib/community/useCommunityPostEngagement";

import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityPostCommentsBlock } from "./CommunityPostCommentsBlock";
import type { ProfileTabPost, ProfileOwner } from "./CommunityProfileTabs";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";

export function CommunityProfilePostsLive({
  profileOwner,
  posts,
  viewerId,
  commentsRedirectTo,
}: {
  profileOwner: ProfileOwner;
  posts: ProfileTabPost[];
  viewerId: string;
  commentsRedirectTo: string;
}) {
  const postIds = posts.map((p) => p.id);
  const initial = engagementFromProfilePosts(posts);
  const { getComments, appendComment, removeComment } = useCommunityPostEngagement(
    true,
    postIds,
    initial,
    viewerId
  );

  return (
    <Stack spacing={2}>
      {posts.map((post) => {
        const comments = getComments(post.id);
        return (
          <Card key={post.id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <CommunityAvatar
                  src={profileOwner.avatarUrl}
                  initials={profileOwner.initials}
                  size={40}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                    {profileOwner.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCommunityTimestamp(post.created_at)} · {profileOwner.email}
                  </Typography>
                  {post.body ? (
                    <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                      {post.body}
                    </Typography>
                  ) : null}
                  {post.images.length > 0 ? (
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                      {post.images.map((img) => (
                        <Box
                          key={img.storage_path}
                          component="img"
                          src={img.signedUrl}
                          alt=""
                          sx={{
                            maxWidth: 280,
                            maxHeight: 220,
                            borderRadius: 1,
                            objectFit: "cover",
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  <Divider sx={{ my: 1.5 }} />

                  <CommunityPostCommentsBlock
                    postId={post.id}
                    viewerId={viewerId}
                    comments={comments}
                    redirectTo={commentsRedirectTo}
                    liveUpdates
                    onCommentAdded={(c) => appendComment(post.id, c)}
                    onCommentRemoved={(commentId) => removeComment(commentId, post.id)}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
