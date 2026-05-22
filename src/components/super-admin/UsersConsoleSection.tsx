"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { deleteUserAction, updateUserDetailsAction } from "@/app/private/ae-console/users/actions";
import { inviteSupportTechnicianAction } from "@/app/private/ae-console/users/technicianInviteActions";
import { SUPPORT_TECHNICIAN_ROLE_LABEL } from "@/lib/supportTechnicianInvitations";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
  TableRowActions,
} from "@/components/ui/data-table";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  org_id: string | null;
  role: string;
  app_role_id: string | null;
  support_provider_id?: string | null;
  created_at: string;
};

export type AdminOrgOption = {
  id: string;
  name: string;
};

export type AdminAppRoleOption = {
  id: string;
  slug: string;
  label: string;
};

const UNASSIGNED = "__unassigned__";
const ALL = "__all__";

function monogramFor(user: AdminUserRow) {
  const name = user.full_name?.trim() || user.email;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function roleTone(slug: string): "success" | "info" | "warning" | "neutral" | "primary" {
  if (slug === "super_admin") return "primary";
  if (slug === "org_admin") return "info";
  if (slug === "manager") return "warning";
  if (slug === "vendor") return "success";
  if (slug === "support_technician") return "info";
  return "neutral";
}

export type SupportProviderOption = { id: string; name: string };

export function UsersConsoleSection({
  users,
  orgs,
  appRoles,
  supportProviders = [],
}: {
  users: AdminUserRow[];
  orgs: AdminOrgOption[];
  appRoles: AdminAppRoleOption[];
  supportProviders?: SupportProviderOption[];
}) {
  const [query, setQuery] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>(ALL);
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const orgNameById = useMemo(() => new Map(orgs.map((o) => [o.id, o.name])), [orgs]);
  const slugToRole = useMemo(() => new Map(appRoles.map((r) => [r.slug, r])), [appRoles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (orgFilter === UNASSIGNED && u.org_id) return false;
      if (orgFilter !== ALL && orgFilter !== UNASSIGNED && u.org_id !== orgFilter) return false;
      if (roleFilter !== ALL && u.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = [
        u.full_name ?? "",
        u.email ?? "",
        u.org_id ? orgNameById.get(u.org_id) ?? "" : "",
        u.role,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, orgFilter, roleFilter, orgNameById]);

  const activeFilterCount =
    (orgFilter !== ALL ? 1 : 0) + (roleFilter !== ALL ? 1 : 0) + (query.trim() ? 1 : 0);

  return (
    <>
      <AeConsolePanel noPadding>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider" }}
        >
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, organization…"
            size="small"
            margin="none"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQuery("")} aria-label="Clear search">
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              maxWidth: { md: 420 },
              "& .MuiOutlinedInput-root": {
                bgcolor: (theme) => theme.palette.action.hover,
                "& fieldset": { borderColor: "transparent" },
                "&:hover fieldset": { borderColor: "divider" },
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexGrow: 1, justifyContent: { md: "flex-end" } }}>
            <TextField
              select
              size="small"
              margin="none"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterAltOutlinedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value={ALL}>All organizations</MenuItem>
              <MenuItem value={UNASSIGNED}>
                <em>No organization</em>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} component="li" />
              {orgs.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              margin="none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value={ALL}>All roles</MenuItem>
              {appRoles.map((r) => (
                <MenuItem key={r.id} value={r.slug}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddOutlinedIcon />}
              onClick={() => setInviteOpen(true)}
              disabled={supportProviders.length === 0}
              sx={{ flexShrink: 0 }}
            >
              Invite technician
            </Button>
          </Box>
        </Stack>

        {activeFilterCount > 0 ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              onClick={() => {
                setQuery("");
                setOrgFilter(ALL);
                setRoleFilter(ALL);
              }}
            >
              Clear filters
            </Button>
          </Stack>
        ) : null}

        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack alignItems="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users match your filters.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const orgName = user.org_id ? orgNameById.get(user.org_id) : null;
                const role = slugToRole.get(user.role);
                return (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <TablePrimaryCell
                        primary={user.full_name?.trim() || "No name"}
                        secondary={user.email}
                        monogram={monogramFor(user)}
                      />
                    </TableCell>
                    <TableCell>
                      {orgName ? (
                        <Typography variant="body2">{orgName}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={role?.label ?? user.role}
                        tone={roleTone(user.role)}
                        dot={false}
                      />
                    </TableCell>
                    <TableCell>
                      <TableDateTimeCell iso={user.created_at} />
                    </TableCell>
                    <TableCell align="right">
                      <TableRowActions>
                        <Tooltip title="Edit user">
                          <IconButton size="small" onClick={() => setEditing(user)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(user)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableRowActions>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </DataTable>
      </AeConsolePanel>

      <EditUserDialog
        user={editing}
        orgs={orgs}
        appRoles={appRoles}
        supportProviders={supportProviders}
        onClose={() => setEditing(null)}
      />

      <DeleteUserDialog user={confirmDelete} onClose={() => setConfirmDelete(null)} />

      <InviteTechnicianDialog
        open={inviteOpen}
        supportProviders={supportProviders}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}

function InviteTechnicianDialog({
  open,
  supportProviders,
  onClose,
}: {
  open: boolean;
  supportProviders: SupportProviderOption[];
  onClose: () => void;
}) {
  const formId = "invite-technician-form";
  const defaultProviderId = supportProviders[0]?.id ?? "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        Invite support technician
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Send an email invitation. After signup they appear here as <strong>{SUPPORT_TECHNICIAN_ROLE_LABEL}</strong>{" "}
          and under their support provider.
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
            name="supportProviderId"
            label="Support provider"
            select
            required
            fullWidth
            size="small"
            margin="none"
            defaultValue={defaultProviderId}
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

const NO_PROVIDER = "__none__";

function EditUserDialog({
  user,
  orgs,
  appRoles,
  supportProviders,
  onClose,
}: {
  user: AdminUserRow | null;
  orgs: AdminOrgOption[];
  appRoles: AdminAppRoleOption[];
  supportProviders: SupportProviderOption[];
  onClose: () => void;
}) {
  const formId = "edit-user-form";
  const [selectedRoleId, setSelectedRoleId] = useState(
    user?.app_role_id ?? appRoles.find((r) => r.slug === user?.role)?.id ?? ""
  );
  const selectedSlug = appRoles.find((r) => r.id === selectedRoleId)?.slug ?? user?.role ?? "";
  const isSupportTech = selectedSlug === "support_technician";

  useEffect(() => {
    if (user) {
      setSelectedRoleId(user.app_role_id ?? appRoles.find((r) => r.slug === user.role)?.id ?? "");
    }
  }, [user, appRoles]);

  return (
    <Dialog
      open={Boolean(user)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Edit user
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Update profile, organization, and role assignment.
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
          aria-label="Close"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      {user ? (
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack
            id={formId}
            component="form"
            action={updateUserDetailsAction}
            spacing={2.25}
            onSubmit={() => {
              setTimeout(onClose, 0);
            }}
          >
            <input type="hidden" name="userId" value={user.id} />

            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  letterSpacing: "0.02em",
                }}
              >
                {monogramFor(user)}
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {user.full_name?.trim() || "No name"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Stack>
            </Stack>

            <TextField
              name="fullName"
              label="Full name"
              defaultValue={user.full_name ?? ""}
              fullWidth
              size="small"
              margin="none"
              autoComplete="off"
            />

            <TextField
              name="orgId"
              label="Organization"
              select
              defaultValue={user.org_id ?? UNASSIGNED}
              disabled={isSupportTech}
              fullWidth
              size="small"
              margin="none"
              helperText={isSupportTech ? "Support technicians use a provider company instead of a facility org." : undefined}
            >
              <MenuItem value={UNASSIGNED}>
                <em>No organization</em>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} component="li" />
              {orgs.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              name="appRoleId"
              label="Role"
              select
              required
              defaultValue={user.app_role_id ?? appRoles.find((r) => r.slug === user.role)?.id ?? ""}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              fullWidth
              size="small"
              margin="none"
            >
              {appRoles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <StatusPill label={r.label} tone={roleTone(r.slug)} dot={false} />
                    <Typography variant="caption" color="text.secondary">
                      {r.slug}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {isSupportTech ? (
              <TextField
                name="supportProviderId"
                label="Support provider company"
                select
                required
                fullWidth
                size="small"
                defaultValue={
                  (user as AdminUserRow & { support_provider_id?: string | null }).support_provider_id ?? NO_PROVIDER
                }
              >
                <MenuItem value={NO_PROVIDER}>
                  <em>Select provider</em>
                </MenuItem>
                {supportProviders.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.5 }}>
              <Chip
                label={`User since ${new Date(user.created_at).toLocaleDateString()}`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </DialogContent>
      ) : null}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form={formId} variant="contained">
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>Delete user?</DialogTitle>
      <Divider />
      {user ? (
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This removes <strong>{user.full_name?.trim() || user.email}</strong> from the platform profile table. Their
            sign-in record in <code>auth.users</code> is preserved — they will simply lose access until a profile is
            re-created.
          </Typography>
        </DialogContent>
      ) : null}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {user ? (
          <form action={deleteUserAction} onSubmit={() => setTimeout(onClose, 0)}>
            <input type="hidden" name="userId" value={user.id} />
            <Button type="submit" color="error" variant="contained" startIcon={<DeleteOutlineRoundedIcon />}>
              Delete user
            </Button>
          </form>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
