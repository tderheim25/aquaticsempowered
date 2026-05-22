"use client";

import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { createCommunitySupportTicketAction } from "@/app/(dashboard)/app/support/community-actions";

/** Stable ids so MUI labels/inputs match between SSR and hydration. */
const SUPPORT_SUBJECT_ID = "community-support-subject";
const SUPPORT_BODY_ID = "community-support-body";
const SUPPORT_PRIORITY_ID = "community-support-priority";

function SupportFormFlash() {
  const params = useSearchParams();
  const support = params.get("support");

  if (support === "submitted") {
    return <Alert severity="success">Request submitted. Our team will follow up.</Alert>;
  }
  if (support === "error") {
    return <Alert severity="error">Could not submit. Try again.</Alert>;
  }
  return null;
}

export function CommunitySupportForm() {
  return (
    <Stack spacing={1.5} component="form" action={createCommunitySupportTicketAction}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Platform support
      </Typography>
      <Suspense fallback={null}>
        <SupportFormFlash />
      </Suspense>
      <TextField
        id={SUPPORT_SUBJECT_ID}
        name="subject"
        label="Subject"
        required
        size="small"
        fullWidth
      />
      <TextField
        id={SUPPORT_BODY_ID}
        name="body"
        label="Details"
        multiline
        rows={3}
        size="small"
        fullWidth
      />
      <TextField
        id={SUPPORT_PRIORITY_ID}
        name="priority"
        label="Priority"
        select
        size="small"
        defaultValue="medium"
        sx={{ maxWidth: 200 }}
      >
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="high">High</MenuItem>
        <MenuItem value="urgent">Urgent</MenuItem>
      </TextField>
      <Button type="submit" variant="contained" size="small" sx={{ alignSelf: "flex-start" }}>
        Submit request
      </Button>
    </Stack>
  );
}
