"use client";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  createCommunityCommentAction,
  deleteCommunityCommentAction,
} from "@/app/(dashboard)/app/community/actions";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";

import { communityContainedButtonSx } from "./communityUi";

export type ResolvedPostComment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_display: string;
  author_email: string;
};

function commentAuthorLabel(c: ResolvedPostComment) {
  return c.author_display?.trim() || c.author_email.split("@")[0] || "Member";
}

export function CommunityPostCommentsBlock({
  postId,
  viewerId,
  comments,
  redirectTo,
  liveUpdates = false,
  onCommentAdded,
  onCommentRemoved,
}: {
  postId: string;
  viewerId: string;
  comments: ResolvedPostComment[];
  redirectTo: string;
  /** When true, submit/delete via API without full page reload. */
  liveUpdates?: boolean;
  onCommentAdded?: (comment: ResolvedPostComment) => void;
  onCommentRemoved?: (commentId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState(false);

  const submitLive = (text: string) => {
    setSubmitError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/community/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, comment: text }),
        });
        if (!res.ok) {
          setSubmitError(true);
          return;
        }
        const data = (await res.json()) as { comment: ResolvedPostComment };
        onCommentAdded?.(data.comment);
        window.dispatchEvent(new Event("community-activity-refresh"));
      } catch {
        setSubmitError(true);
      }
    });
  };

  const removeLive = (commentId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/comments?id=${encodeURIComponent(commentId)}`, {
          method: "DELETE",
        });
        if (!res.ok) return;
        onCommentRemoved?.(commentId);
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <Box sx={{ mt: 0 }}>
      {comments.length > 0 ? (
        <Stack spacing={1.25} sx={{ mb: 1.5 }}>
          {comments.map((c) => (
            <Box
              key={c.id}
              sx={{
                pl: 1.5,
                borderLeft: 2,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 0.5 }}>
                    <Typography
                      component={Link}
                      href={`/app/community/profile/${c.author_id}`}
                      variant="caption"
                      sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none" }}
                    >
                      {commentAuthorLabel(c)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCommunityTimestamp(c.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {c.body}
                  </Typography>
                </Box>
                {c.author_id === viewerId ? (
                  liveUpdates ? (
                    <Button
                      type="button"
                      size="small"
                      color="error"
                      variant="text"
                      disabled={pending}
                      onClick={() => removeLive(c.id)}
                      sx={{ flexShrink: 0 }}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Box component="form" action={deleteCommunityCommentAction} sx={{ flexShrink: 0 }}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <Button type="submit" size="small" color="error" variant="text">
                        Remove
                      </Button>
                    </Box>
                  )
                ) : null}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}

      {liveUpdates ? (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const text = String(fd.get("comment") ?? "").trim();
            if (!text) return;
            submitLive(text);
            e.currentTarget.reset();
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
            <TextField
              id={`community-comment-${postId}`}
              name="comment"
              label="Write a comment"
              placeholder="Say something…"
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              size="small"
              autoComplete="off"
              disabled={pending}
              error={submitError}
              helperText={submitError ? "Could not post comment. Try again." : undefined}
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={pending}
              sx={{ flexShrink: 0, alignSelf: { sm: "center" }, ...communityContainedButtonSx() }}
            >
              Comment
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" action={createCommunityCommentAction}>
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
            <TextField
              id={`community-comment-${postId}`}
              name="comment"
              label="Write a comment"
              placeholder="Say something…"
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              size="small"
              autoComplete="off"
              inputProps={{ maxLength: 2000 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{ flexShrink: 0, alignSelf: { sm: "center" }, ...communityContainedButtonSx() }}
            >
              Comment
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
