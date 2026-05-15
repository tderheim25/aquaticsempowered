import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { CommunityPostCommentsBlock, type ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { CommunitySpotlightRail, type CommunityVendorSpotlight } from "@/components/community/CommunitySpotlightRail";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";
import { signCommunityMediaPaths } from "@/lib/community/signMedia";
import { createClient } from "@/lib/supabase/server";

import {
  createCommunityPostAction,
  deleteCommunityPostAction,
  toggleCommunityLikeAction,
} from "./actions";

export const metadata = {
  title: "Community | Aquatics Empowered",
};

function statusMessage(status?: string) {
  switch (status) {
    case "created":
      return { severity: "success" as const, text: "Post published." };
    case "deleted":
      return { severity: "success" as const, text: "Post removed." };
    case "invalid":
      return { severity: "error" as const, text: "Add some text or at least one image." };
    case "invalid_file":
      return { severity: "error" as const, text: "Only JPEG, PNG, WebP, or GIF images are allowed." };
    case "file_too_large":
      return { severity: "error" as const, text: "Each image must be 5 MB or smaller." };
    case "too_many_images":
      return { severity: "error" as const, text: "You can attach up to 5 images per post." };
    case "upload_error":
      return { severity: "error" as const, text: "Image upload failed. Try again." };
    case "error":
      return { severity: "error" as const, text: "Something went wrong. Please try again." };
    case "post_save_failed":
      return {
        severity: "error" as const,
        text:
          "Could not save your post. Apply Supabase migrations 0007 and 0008 if you have not, then sign out and sign back in so your JWT matches your account.",
      };
    case "media_save_failed":
      return {
        severity: "error" as const,
        text: "Your post was saved but attaching an image failed. Try removing photos and posting again, or use a smaller image.",
      };
    case "comment_invalid":
      return { severity: "error" as const, text: "Add a comment before submitting." };
    case "comment_error":
      return { severity: "error" as const, text: "Could not save that comment. Try again." };
    default:
      return null;
  }
}

function displayName(u: { full_name: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

function initials(u: { full_name: string | null; email: string }) {
  const n = displayName(u);
  return n.slice(0, 2).toUpperCase();
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireViewAccess("community");
  const profile = await requireProfileForApp();
  const { status } = await searchParams;
  const flash = statusMessage(status);

  const supabase = await createClient();

  const { data: followsRows } = await supabase
    .from("community_follows")
    .select("followee_id")
    .eq("follower_id", profile.id);
  const followedIds = new Set((followsRows ?? []).map((r) => r.followee_id));

  const postsQuery = supabase
    .from("community_posts")
    .select("id, author_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(120);
  if (profile.org_id) {
    postsQuery.eq("org_id", profile.org_id);
  } else {
    postsQuery.is("org_id", null);
  }
  const { data: posts, error: postsError } = await postsQuery;

  const postList = [...(posts ?? [])]
    .sort((a, b) => {
      const af = followedIds.has(a.author_id) ? 0 : 1;
      const bf = followedIds.has(b.author_id) ? 0 : 1;
      if (af !== bf) return af - bf;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 40);
  const postIds = postList.map((p) => p.id);

  const postAuthorIds = [...new Set(postList.map((p) => p.author_id))];

  const { data: commentRows } =
    postIds.length > 0
      ? await supabase
          .from("community_post_comments")
          .select("id, post_id, author_id, body, created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : { data: [] as { id: string; post_id: string; author_id: string; body: string; created_at: string }[] };

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

  const { data: mediaRows } =
    postIds.length > 0
      ? await supabase.from("community_post_media").select("post_id, storage_path, sort_order").in("post_id", postIds)
      : { data: [] as { post_id: string; storage_path: string; sort_order: number }[] };

  const mediaByPost = new Map<string, { storage_path: string; sort_order: number }[]>();
  for (const m of mediaRows ?? []) {
    const list = mediaByPost.get(m.post_id) ?? [];
    list.push(m);
    mediaByPost.set(m.post_id, list);
  }
  for (const [, list] of mediaByPost) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data: likeRows } =
    postIds.length > 0
      ? await supabase.from("community_likes").select("post_id, user_id").in("post_id", postIds)
      : { data: [] as { post_id: string; user_id: string }[] };

  const likeCountByPost = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCountByPost.set(row.post_id, (likeCountByPost.get(row.post_id) ?? 0) + 1);
    if (row.user_id === profile.id) {
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

  return (
    <>
    <Container
      maxWidth="xl"
      sx={{
        ml: { xs: "auto", md: 0 },
        mr: { xs: "auto", md: "auto" },
      }}
    >
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: { xs: "flex-start", lg: "stretch" },
        gap: { xs: 2, lg: 3 },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: { lg: "min(100%, 860px)" } }}>
    <Stack spacing={2} sx={{ pb: { xs: 10, md: 12 } }}>
      <div>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Community
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Share updates, react with likes, and grow your network
          {profile.org_id ? " with your organization." : " with other members."}
        </Typography>
      </div>

      {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}
      {postsError ? <Alert severity="error">Could not load the feed.</Alert> : null}

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

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Feed
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Posts from people you follow are shown first, then everyone else (newest first in each group).
      </Typography>

      {postList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No posts yet. Be the first to share something with your team.
        </Typography>
      ) : null}

      <Stack spacing={2}>
        {postList.map((post) => {
          const author = authorById.get(post.author_id);
          const media = mediaByPost.get(post.id) ?? [];
          const likes = likeCountByPost.get(post.id) ?? 0;
          const liked = likedByMe.has(post.id);
          const name = author ? displayName(author) : "Unknown";
          const sub = author?.email ?? "";

          return (
            <Card key={post.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Link href={`/app/community/profile/${post.author_id}`} style={{ textDecoration: "none" }}>
                    <Avatar>{author ? initials(author) : "?"}</Avatar>
                  </Link>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box>
                        <Typography
                          component={Link}
                          href={`/app/community/profile/${post.author_id}`}
                          variant="subtitle1"
                          sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none" }}
                        >
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCommunityTimestamp(post.created_at)} · {sub}
                        </Typography>
                      </Box>
                      {post.author_id === profile.id ? (
                        <Box component="form" action={deleteCommunityPostAction}>
                          <input type="hidden" name="postId" value={post.id} />
                          <Button type="submit" size="small" color="error">
                            Delete
                          </Button>
                        </Box>
                      ) : null}
                    </Stack>

                    {post.body ? (
                      <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                        {post.body}
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

                    <CommunityPostCommentsBlock
                      postId={post.id}
                      viewerId={profile.id}
                      comments={commentsByPost.get(post.id) ?? []}
                      redirectTo="/app/community"
                    />

                    <Divider sx={{ my: 1.5 }} />

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box component="form" action={toggleCommunityLikeAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="small" variant={liked ? "contained" : "outlined"}>
                          {liked ? "Liked" : "Like"} · {likes}
                        </Button>
                      </Box>
                      <Button size="small" component={Link} href={`/app/community/profile/${post.author_id}`}>
                        View profile
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
    </Box>

      <Box
        sx={{
          width: { xs: "100%", lg: 300 },
          flexShrink: 0,
          display: { lg: "flex" },
          flexDirection: { lg: "column" },
          alignItems: { lg: "stretch" },
          pl: { lg: 0 },
          pr: { xs: 0, lg: 1 },
          pb: { xs: 2, lg: 12 },
        }}
      >
        <CommunitySpotlightRail vendors={vendorSpotlights} />
      </Box>
    </Box>
    </Container>
    </>
  );
}
