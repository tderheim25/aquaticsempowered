"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { inviteSupportTechnicianAction } from "@/app/private/ae-console/users/technicianInviteActions";
import { SUPPORT_TECHNICIAN_ROLE_LABEL } from "@/lib/supportTechnicianInvitations";

export type SupportProviderOption = { id: string; name: string };

export function InviteTechnicianDialog({
  open,
  supportProviders,
  defaultProviderId,
  onClose,
}: {
  open: boolean;
  supportProviders: SupportProviderOption[];
  defaultProviderId?: string;
  onClose: () => void;
}) {
  const formId = "invite-technician-form";
  const resolvedProviderId = defaultProviderId ?? supportProviders[0]?.id ?? "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        Invite support technician
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Send an email invitation. After signup they appear as <strong>{SUPPORT_TECHNICIAN_ROLE_LABEL}</strong> under
          their support provider.
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }} aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack
          id={formId}
          component="form"
          action={inviteSupportTechnicianAction}
          spacing={2.25}
          onSubmit={() => setTimeout(onClose, 0)}
        >
          <TextField
            name="email"
            type="email"
            label="Email address"
            required
            fullWidth
            size="small"
            margin="none"
            autoComplete="off"
            placeholder="technician@example.com"
          />
          <TextField name="fullName" label="Full name (optional)" fullWidth size="small" margin="none" autoComplete="off" />
          <TextField
            key={resolvedProviderId}
            name="supportProviderId"
            label="Support provider"
            select
            required
            fullWidth
            size="small"
            margin="none"
            defaultValue={resolvedProviderId}
          >
            {supportProviders.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            name="message"
            label="Personal note (optional)"
            fullWidth
            size="small"
            margin="none"
            multiline
            minRows={2}
            placeholder="Welcome to the support team."
          />
          <Box
            sx={(theme) => ({
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: theme.palette.action.hover,
              border: 1,
              borderColor: "divider",
            })}
          >
            <Typography variant="caption" color="text.secondary">
              <strong>New users</strong> receive a signup link and are linked to the provider automatically.
              <br />
              <strong>Existing users</strong> sign in and complete acceptance from the invitation link.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} variant="contained">
          Send invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
