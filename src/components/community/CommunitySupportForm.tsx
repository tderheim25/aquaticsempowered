"use client";

import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { createCommunitySupportTicketAction } from "@/app/(dashboard)/app/support/community-actions";

export function CommunitySupportForm() {
  const params = useSearchParams();
  const support = params.get("support");

  return (
    <Stack spacing={1.5} component="form" action={createCommunitySupportTicketAction}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Platform support
      </Typography>
      {support === "submitted" ? <Alert severity="success">Request submitted. Our team will follow up.</Alert> : null}
      {support === "error" ? <Alert severity="error">Could not submit. Try again.</Alert> : null}
      <TextField name="subject" label="Subject" required size="small" fullWidth />
      <TextField name="body" label="Details" multiline rows={3} size="small" fullWidth />
      <TextField name="priority" label="Priority" select size="small" defaultValue="medium" sx={{ maxWidth: 200 }}>
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
