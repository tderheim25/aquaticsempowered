import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import {
  createCommunityCommentAction,
  deleteCommunityCommentAction,
} from "@/app/(dashboard)/app/community/actions";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";

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
}: {
  postId: string;
  viewerId: string;
  comments: ResolvedPostComment[];
  redirectTo: string;
}) {
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
                  <Box component="form" action={deleteCommunityCommentAction} sx={{ flexShrink: 0 }}>
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <Button type="submit" size="small" color="error">
                      Remove
                    </Button>
                  </Box>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}

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
            inputProps={{ maxLength: 2000 }}
          />
          <Button type="submit" variant="outlined" size="small" sx={{ flexShrink: 0, alignSelf: { sm: "center" } }}>
            Comment
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
