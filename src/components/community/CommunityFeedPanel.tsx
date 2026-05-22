"use client";

import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { createCommunityPostAction } from "@/app/(dashboard)/app/community/actions";
import { serializeFeedEngagement, type SerializedCommunityFeed } from "@/lib/community/serializeFeedEngagement";
import type { LoadedCommunityJobs } from "@/lib/community/loadCommunityJobsData";
import { CommunityFeedTabLinks, type CommunityFeedTab } from "./CommunityFeedTabLinks";
import { CommunityPageContainer } from "./CommunityPageContainer";
import { CommunityPageHeader } from "./CommunityPageHeader";
import { CommunityJobsSection } from "./CommunityJobsSection";
import { CommunityMarketplaceSection } from "./CommunityMarketplaceSection";
import type { LoadedCommunityMarketplace } from "@/lib/community/loadCommunityMarketplaceData";
import { CommunitySearchBar } from "./CommunitySearchBar";
import { CommunityFeedPostsLive } from "./CommunityFeedPostsLive";
import { CommunitySpotlightRail } from "./CommunitySpotlightRail";
import {
  communityContainedButtonSx,
  communitySectionTitleSx,
  communitySurfacePaperSx,
} from "./communityUi";

export type { CommunityFeedTab };

export type CommunityFeedPanelProps = {
  variant: "full" | "preview";
  activeTab?: CommunityFeedTab;
  /** Max characters of post body in preview (remainder hidden behind sign-in). */
      previewBodyMaxChars?: number;
  viewer: { id: string; org_id: string | null } | null;
  canInteract: boolean;
  feed: SerializedCommunityFeed;
  jobsFeed: LoadedCommunityJobs;
  marketplace: LoadedCommunityMarketplace;
  flash: { severity: "success" | "error"; text: string } | null;
  /**
   * Omit to use the default org/global tagline under the title.
   * Pass "" to hide the line (e.g. public preview uses its own “highlights” copy below).
   */
  subtitle?: string | null;
};

export function CommunityFeedPanel({
  variant,
  activeTab = "feed",
  previewBodyMaxChars = 260,
  viewer,
  canInteract,
  feed,
  jobsFeed,
  marketplace,
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
    organizationSpotlights,
  } = feed;

  const showComposer = variant === "full" && canInteract && viewer;

  const defaultSubtitle = viewer?.org_id
    ? "Share updates, react with likes, and grow your network with your organization."
    : "Share updates, react with likes, and grow your network with other members.";

  const effectiveSubtitle = subtitle === undefined ? defaultSubtitle : subtitle;

  return (
    <CommunityPageContainer>
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
            <CommunityPageHeader
              eyebrow="Connect · Share · Grow"
              title="Community"
              subtitle={effectiveSubtitle || undefined}
            />

            {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}

            {canInteract ? <CommunitySearchBar /> : null}

            <CommunityFeedTabLinks
              activeTab={activeTab}
              jobCount={jobsFeed.jobs.length}
              marketplaceProductCount={marketplace.productCount}
            />

            {activeTab === "jobs" ? (
              <CommunityJobsSection
                variant={variant}
                viewer={viewer}
                canInteract={canInteract}
                jobsFeed={jobsFeed}
              />
            ) : activeTab === "marketplace" ? (
              <CommunityMarketplaceSection variant={variant} marketplace={marketplace} signedIn={canInteract} />
            ) : (
              <>
            {postsError ? <Alert severity="error">Could not load the feed.</Alert> : null}

            {showComposer ? (
              <Paper variant="outlined" sx={communitySurfacePaperSx()}>
                <Typography variant="h6" sx={{ ...communitySectionTitleSx, mb: 1.5 }}>
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
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ alignSelf: "flex-start", ...communityContainedButtonSx() }}
                    >
                      Post
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            ) : null}

            {variant === "full" && canInteract ? (
              <>
                <Typography variant="h6" sx={communitySectionTitleSx}>
                  Feed
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Posts from people you follow are shown first, then everyone else (newest first in each group).
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={communitySectionTitleSx}>
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

            <CommunityFeedPostsLive
              variant={variant}
              previewBodyMaxChars={previewBodyMaxChars}
              viewer={viewer}
              canInteract={canInteract}
              posts={postList}
              authors={authorById}
              mediaByPost={mediaByPost}
              signedByPath={signedByPath}
              engagement={serializeFeedEngagement({ commentsByPost, likeCountByPost, likedByMe })}
            />

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
            organizations={organizationSpotlights}
            showSupportForm={variant === "full" && canInteract}
          />
        </Box>
      </Box>
    </CommunityPageContainer>
  );
}
