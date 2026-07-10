"use client";

import { Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useFormStatus } from "react-dom";

import { createCommunityPostAction } from "@/app/(dashboard)/app/community/actions";

import { communityContainedButtonSx } from "./communityUi";

function CommunityPostComposerFields() {
  const { pending } = useFormStatus();

  return (
    <Stack spacing={1.5}>
      <TextField
        id="community-new-post-body"
        name="body"
        label="What is on your mind?"
        multiline
        minRows={3}
        fullWidth
        placeholder="Write something…"
        disabled={pending}
      />
      <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }} disabled={pending}>
        Add photos
        <input
          type="file"
          name="images"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          disabled={pending}
        />
      </Button>
      <Typography variant="caption" color="text.secondary">
        Up to 5 images, 5 MB each (JPEG, PNG, WebP, GIF).
      </Typography>
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        sx={{ alignSelf: "flex-start", ...communityContainedButtonSx() }}
        startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {pending ? "Posting…" : "Post"}
      </Button>
    </Stack>
  );
}

export function CommunityPostComposer() {
  return (
    <Box component="form" action={createCommunityPostAction}>
      <CommunityPostComposerFields />
    </Box>
  );
}
