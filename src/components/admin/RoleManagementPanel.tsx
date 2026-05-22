"use client";

import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { deleteAppRoleAction, updateAppRoleAction, updateRoleViewPermissionsAction } from "@/app/private/ae-console/permissions/actions";
import type { UserRole } from "@/types/database";

type RoleRow = {
  id: string;
  slug: string;
  label: string;
  permissions_base: UserRole;
  is_builtin: boolean;
};

export function RoleManagementPanel({
  roles,
  selectedByRoleId,
  allRoles,
  viewDefinitions,
}: {
  roles: RoleRow[];
  selectedByRoleId: Record<string, string[]>;
  allRoles: UserRole[];
  viewDefinitions: { key: string; label: string }[];
}) {
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  const activeRole = useMemo(() => roles.find((role) => role.id === openRoleId) ?? null, [roles, openRoleId]);
  const allowedViews = useMemo(() => new Set(selectedByRoleId[activeRole?.id ?? ""] ?? []), [selectedByRoleId, activeRole?.id]);

  return (
    <>
      <Paper variant="outlined">
        <List disablePadding>
          {roles.map((role, idx) => (
            <Box key={role.id}>
              <ListItemButton onClick={() => setOpenRoleId(role.id)}>
                <ListItemText
                  primary={role.label}
                  secondary={`${role.is_builtin ? "Built-in" : "Custom"} · base: ${role.permissions_base}`}
                />
                <Button size="small" variant="outlined" onClick={() => setOpenRoleId(role.id)}>
                  Manage
                </Button>
              </ListItemButton>
              {idx < roles.length - 1 ? <Divider /> : null}
            </Box>
          ))}
        </List>
      </Paper>

      <Dialog open={Boolean(activeRole)} onClose={() => setOpenRoleId(null)} maxWidth="md" fullWidth>
        {activeRole ? (
          <>
            <DialogTitle>Manage role: {activeRole.label}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box component="form" action={updateAppRoleAction}>
                  <input type="hidden" name="roleId" value={activeRole.id} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                    <TextField name="label" label="Role name" defaultValue={activeRole.label} size="small" fullWidth disabled={activeRole.is_builtin} />
                    <TextField
                      name="permissionsBase"
                      label="Base (RLS)"
                      select
                      size="small"
                      defaultValue={activeRole.permissions_base}
                      sx={{ minWidth: 180 }}
                      disabled={activeRole.is_builtin}
                    >
                      {allRoles.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button type="submit" variant="outlined" disabled={activeRole.is_builtin}>
                      Update role
                    </Button>
                    {!activeRole.is_builtin ? (
                      <Button type="submit" color="error" formAction={deleteAppRoleAction}>
                        Remove role
                      </Button>
                    ) : null}
                  </Stack>
                </Box>

                <Box component="form" action={updateRoleViewPermissionsAction}>
                  <input type="hidden" name="roleId" value={activeRole.id} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    View access
                  </Typography>
                  <Stack>
                    {viewDefinitions.map((view) => (
                      <Box key={`${activeRole.id}-${view.key}`} component="label" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox name="views" value={view.key} defaultChecked={allowedViews.has(view.key)} />
                        <Typography variant="body2">{view.label}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button type="submit" variant="contained" sx={{ mt: 1 }}>
                    Save view access
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenRoleId(null)}>Close</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </>
  );
}
