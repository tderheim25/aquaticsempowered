import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  createCommunityPostAction,
  deleteCommunityPostAction,
  toggleCommunityLikeAction,
} from "@/app/(dashboard)/app/community/actions";
import type { LoadedCommunityFeed } from "@/lib/community/loadCommunityFeedData";
import type { LoadedCommunityJobs } from "@/lib/community/loadCommunityJobsData";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";

import { CommunityJobsSection } from "./CommunityJobsSection";
import { CommunitySearchBar } from "./CommunitySearchBar";
import { CommunityPostCommentsBlock } from "./CommunityPostCommentsBlock";
import { CommunitySpotlightRail } from "./CommunitySpotlightRail";

const COMMUNITY_FEED_PATH = "/community";

export type CommunityFeedTab = "feed" | "jobs";

export type CommunityFeedPanelProps = {
  variant: "full" | "preview";
  activeTab?: CommunityFeedTab;
  /** Max characters of post body in preview (remainder hidden behind sign-in). */
      previewBodyMaxChars?: number;
  viewer: { id: string; org_id: string | null } | null;
  canInteract: boolean;
  feed: LoadedCommunityFeed;
  jobsFeed: LoadedCommunityJobs;
  flash: { severity: "success" | "error"; text: string } | null;
  /**
   * Omit to use the default org/global tagline under the title.
   * Pass "" to hide the line (e.g. public preview uses its own “highlights” copy below).
   */
  subtitle?: string | null;
};

function displayName(u: { full_name: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

function initials(u: { full_name: string | null; email: string }) {
  const n = displayName(u);
  return n.slice(0, 2).toUpperCase();
}

function truncateBody(body: string, max: number) {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function CommunityFeedPanel({
  variant,
  activeTab = "feed",
  previewBodyMaxChars = 260,
  viewer,
  canInteract,
  feed,
  jobsFeed,
  flash,
  subtitle,
}: CommunityFeedPanelProps) {
  const {
    posts: postList,
    postsError,
    authorById,
    commentsByPost,
    mediaByPost,
    signedByPath,
    likeCountByPost,
    likedByMe,
    vendorSpotlights,
  } = feed;

  const showComposer = variant === "full" && canInteract && viewer;

  const profileHrefForAuthor = (authorId: string) => `/app/community/profile/${authorId}`;
  const loginForProfileHref = (authorId: string) =>
    `/login?next=${encodeURIComponent(profileHrefForAuthor(authorId))}`;

  const defaultSubtitle = viewer?.org_id
    ? "Share updates, react with likes, and grow your network with your organization."
    : "Share updates, react with likes, and grow your network with other members.";

  const effectiveSubtitle = subtitle === undefined ? defaultSubtitle : subtitle;

  return (
    <ContainerLike>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "flex-start", lg: "stretch" },
          gap: { xs: 2, lg: 3 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={2} sx={{ pb: { xs: 10, md: 12 } }}>
            <div>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Community
              </Typography>
              {effectiveSubtitle ? (
                <Typography variant="body1" color="text.secondary">
                  {effectiveSubtitle}
                </Typography>
              ) : null}
            </div>

            {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}

            {canInteract ? <CommunitySearchBar /> : null}

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                component={Link}
                href="/community"
                variant={activeTab === "feed" ? "contained" : "outlined"}
                size="small"
              >
                Updates
              </Button>
              <Button
                component={Link}
                href="/community?tab=jobs"
                variant={activeTab === "jobs" ? "contained" : "outlined"}
                size="small"
              >
                Jobs
                {jobsFeed.jobs.length > 0 ? (
                  <Typography component="span" variant="caption" sx={{ ml: 0.75, opacity: 0.9 }}>
                    ({jobsFeed.jobs.length})
                  </Typography>
                ) : null}
              </Button>
            </Stack>

            {activeTab === "jobs" ? (
              <CommunityJobsSection
                variant={variant}
                viewer={viewer}
                canInteract={canInteract}
                jobsFeed={jobsFeed}
              />
            ) : (
              <>
            {postsError ? <Alert severity="error">Could not load the feed.</Alert> : null}

            {showComposer ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Create a post
                </Typography>
                <Box component="form" action={createCommunityPostAction}>
                  <Stack spacing={1.5}>
                    <TextField
                      id="community-new-post-body"
                      name="body"
                      label="What is on your mind?"
                      multiline
                      minRows={3}
                      fullWidth
                      placeholder="Write something…"
                    />
                    <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
                      Add photos
                      <input type="file" name="images" multiple accept="image/jpeg,image/png,image/webp,image/gif" hidden />
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Up to 5 images, 5 MB each (JPEG, PNG, WebP, GIF).
                    </Typography>
                    <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
                      Post
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            ) : null}

            {variant === "full" && canInteract ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Feed
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Posts from people you follow are shown first, then everyone else (newest first in each group).
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Highlights from the community
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Sign in for the full feed, comments, likes, and teammate profiles — these are recent public discussions
                  from operators on the platform.
                </Typography>
              </>
            )}

            {postList.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {variant === "preview"
                  ? "No public posts yet. Sign in when you’re ready — your team may already be sharing updates."
                  : "No posts yet. Be the first to share something with your team."}
              </Typography>
            ) : null}

            <Stack spacing={2}>
              {postList.map((post) => {
                const author = authorById.get(post.author_id);
                const media = mediaByPost.get(post.id) ?? [];
                const likes = likeCountByPost.get(post.id) ?? 0;
                const liked = likedByMe.has(post.id);
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
                          <Avatar>{author ? initials(author) : "?"}</Avatar>
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
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
                              {media.map((m) => {
                                const src = signedByPath.get(m.storage_path);
                                if (!src) return null;
                                return (
                                  <Box
                                    key={m.storage_path}
                                    component="img"
                                    src={src}
                                    alt=""
                                    sx={{ maxWidth: 280, maxHeight: 220, borderRadius: 1, objectFit: "cover" }}
                                  />
                                );
                              })}
                            </Stack>
                          ) : null}

                          <Divider sx={{ my: 1.5 }} />

                          {variant === "full" && canInteract && viewer ? (
                            <CommunityPostCommentsBlock
                              postId={post.id}
                              viewerId={viewer.id}
                              comments={commentsByPost.get(post.id) ?? []}
                              redirectTo={COMMUNITY_FEED_PATH}
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
                              <Box component="form" action={toggleCommunityLikeAction}>
                                <input type="hidden" name="postId" value={post.id} />
                                <Button type="submit" size="small" variant={liked ? "contained" : "outlined"}>
                                  {liked ? "Liked" : "Like"} · {likes}
                                </Button>
                              </Box>
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

            {variant === "preview" ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Want the full picture?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Create posts, swap comments, follow peers, and open full operator profiles inside your portal — free
                  plans include community access for eligible roles.
                </Typography>
                <Button component={Link} href="/login?next=%2Fcommunity" variant="contained" color="primary">
                  Sign in to continue
                </Button>
              </Paper>
            ) : null}
              </>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: 320, xl: 360 },
            flexShrink: 0,
            alignSelf: { lg: "flex-start" },
            position: { lg: "sticky" },
            top: { lg: 80 },
            maxHeight: { lg: "calc(100vh - 96px)" },
            overflowY: { lg: "auto" },
            overflowX: "hidden",
            pl: { lg: 0 },
            pr: { xs: 0, lg: 1 },
            pb: { xs: 2, lg: 1 },
          }}
        >
          <CommunitySpotlightRail
            vendors={vendorSpotlights}
            showSupportForm={variant === "full" && canInteract}
          />
        </Box>
      </Box>
    </ContainerLike>
  );
}

function ContainerLike({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {children}
    </Box>
  );
}
