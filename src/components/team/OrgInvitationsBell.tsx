"use client";

import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import {
  acceptOrgInvitationAction,
  declineOrgInvitationAction,
} from "@/app/(dashboard)/app/invitations/actions";

export type PendingInvitation = {
  id: string;
  orgId: string;
  orgName: string;
  role: string;
  roleLabel: string;
  inviterName: string | null;
  message: string | null;
  createdAt: string;
  expiresAt: string;
};

export function useOrgInvitations(enabled: boolean) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setInvitations([]);
      return;
    }
    try {
      const res = await fetch("/api/org/invitations", { cache: "no-store" });
      if (!res.ok) {
        setInvitations([]);
        return;
      }
      const data = (await res.json()) as { items?: PendingInvitation[] };
      setInvitations(data.items ?? []);
    } catch {
      setInvitations([]);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  return { invitations, refresh };
}

export function OrgInvitationsMenuItems({
  invitations,
  onResolve,
}: {
  invitations: PendingInvitation[];
  onResolve: () => void;
}) {
  if (!invitations.length) return null;

  return (
    <>
      <MenuItem disabled sx={{ flexDirection: "column", alignItems: "flex-start", opacity: "1 !important" }}>
        <Typography variant="subtitle2">Organization invitations</Typography>
        <Typography variant="caption" color="text.secondary">
          {invitations.length} pending invite{invitations.length === 1 ? "" : "s"}
        </Typography>
      </MenuItem>

      {invitations.slice(0, 4).map((invite) => (
        <Box
          key={invite.id}
          sx={(t) => ({
            px: 2,
            py: 1.25,
            borderTop: 1,
            borderColor: "divider",
            background: `linear-gradient(135deg, ${t.palette.primary.main}06 0%, ${t.palette.secondary.main}08 100%)`,
          })}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
              <BusinessRoundedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {invite.orgName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {invite.inviterName ? `${invite.inviterName} • ` : ""}
                Role: <strong>{invite.roleLabel}</strong>
              </Typography>
              {invite.message && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}>
                  “{invite.message}”
                </Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <form
                  action={acceptOrgInvitationAction}
                  onSubmit={() => setTimeout(onResolve, 0)}
                  style={{ flex: 1 }}
                >
                  <input type="hidden" name="invitationId" value={invite.id} />
                  <input type="hidden" name="redirectTo" value="/app" />
                  <Button
                    type="submit"
                    size="small"
                    variant="contained"
                    fullWidth
                    startIcon={<CheckRoundedIcon fontSize="small" />}
                  >
                    Accept
                  </Button>
                </form>
                <form action={declineOrgInvitationAction} onSubmit={() => setTimeout(onResolve, 0)}>
                  <input type="hidden" name="invitationId" value={invite.id} />
                  <input type="hidden" name="redirectTo" value="/app" />
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseRoundedIcon fontSize="small" />}
                  >
                    Decline
                  </Button>
                </form>
              </Stack>
            </Box>
          </Stack>
        </Box>
      ))}

      <Divider />
    </>
  );
}
