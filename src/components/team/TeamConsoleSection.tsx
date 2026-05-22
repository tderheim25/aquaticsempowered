"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
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
import { useMemo, useState } from "react";

import {
  cancelOrgInvitationAction,
  inviteOrgMemberAction,
  removeOrgMemberAction,
  resendOrgInvitationAction,
  updateOrgMemberDetailsAction,
} from "@/app/(dashboard)/app/team/actions";
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

export type TeamMember = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export type PendingInvitation = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  expires_at: string;
  kind: "new" | "existing";
};

type OrgRoleSlug = "org_admin" | "manager" | "staff";

const ORG_ROLE_OPTIONS: { slug: OrgRoleSlug; label: string; description: string }[] = [
  { slug: "org_admin", label: "Org Admin", description: "Full control of the organization" },
  { slug: "manager", label: "Manager", description: "Manages teams, schedules, and reports" },
  { slug: "staff", label: "Staff", description: "Day-to-day operators (default)" },
];

const ALL = "__all__";

function monogramFor(member: { full_name: string | null; email: string }) {
  const name = member.full_name?.trim() || member.email;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function roleTone(slug: string): "info" | "warning" | "neutral" {
  if (slug === "org_admin") return "info";
  if (slug === "manager") return "warning";
  return "neutral";
}

function roleLabel(slug: string) {
  return ORG_ROLE_OPTIONS.find((r) => r.slug === slug)?.label ?? slug.replace("_", " ");
}

export function TeamConsoleSection({
  members,
  currentUserId,
  orgName,
  pendingInvitations = [],
}: {
  members: TeamMember[];
  currentUserId: string;
  orgName: string | null;
  pendingInvitations?: PendingInvitation[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  const counts = useMemo(() => {
    const base = { total: members.length, org_admin: 0, manager: 0, staff: 0 } as Record<string, number>;
    for (const m of members) {
      if (m.role in base) base[m.role] += 1;
    }
    return base;
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== ALL && m.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = [m.full_name ?? "", m.email, m.role].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query, roleFilter]);

  const activeFilters = (roleFilter !== ALL ? 1 : 0) + (query.trim() ? 1 : 0);

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }} sx={{ flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={`${counts.total} member${counts.total === 1 ? "" : "s"}`}
            variant="outlined"
          />
          <Chip size="small" label={`${counts.org_admin} admin`} variant="outlined" />
          <Chip size="small" label={`${counts.manager} manager`} variant="outlined" />
          <Chip size="small" label={`${counts.staff} staff`} variant="outlined" />
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<PersonAddAlt1RoundedIcon />}
          onClick={() => setInviteOpen(true)}
          sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
        >
          Add user
        </Button>
      </Stack>

      <Box
        sx={(theme) => ({
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: theme.palette.background.paper,
          overflow: "hidden",
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider" }}
        >
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teammates by name, email, role…"
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value={ALL}>All roles</MenuItem>
              {ORG_ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.slug} value={r.slug}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>

        {activeFilters > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ px: 2.5, py: 1, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              onClick={() => {
                setQuery("");
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
              <TableCell>Member</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Stack alignItems="center" sx={{ py: 5 }} spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      {members.length === 0
                        ? "No teammates yet. Invite your first user."
                        : "No teammates match your filters."}
                    </Typography>
                    {members.length === 0 ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAddAlt1RoundedIcon />}
                        onClick={() => setInviteOpen(true)}
                      >
                        Add user
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <TablePrimaryCell
                      primary={member.full_name?.trim() || "No name"}
                      secondary={member.email}
                      monogram={monogramFor(member)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusPill label={roleLabel(member.role)} tone={roleTone(member.role)} dot={false} />
                  </TableCell>
                  <TableCell>
                    <TableDateTimeCell iso={member.created_at} />
                  </TableCell>
                  <TableCell align="right">
                    <TableRowActions>
                      <Tooltip title="Edit member">
                        <IconButton size="small" onClick={() => setEditing(member)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from organization">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={member.id === currentUserId}
                            onClick={() => setRemoving(member)}
                          >
                            <PersonRemoveRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableRowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </Box>

      <PendingInvitationsPanel invitations={pendingInvitations} />

      <InviteMemberDialog
        open={inviteOpen}
        orgName={orgName}
        onClose={() => setInviteOpen(false)}
      />
      <EditMemberDialog
        member={editing}
        currentUserId={currentUserId}
        onClose={() => setEditing(null)}
      />
      <RemoveMemberDialog member={removing} orgName={orgName} onClose={() => setRemoving(null)} />
    </>
  );
}

function formatExpiry(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days === 1) return "Expires tomorrow";
  if (days <= 14) return `Expires in ${days} days`;
  return `Expires ${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function PendingInvitationsPanel({ invitations }: { invitations: PendingInvitation[] }) {
  if (!invitations.length) return null;
  return (
    <Box
      sx={(theme) => ({
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: theme.palette.background.paper,
        overflow: "hidden",
      })}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider" }}>
        <MailOutlineRoundedIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Pending invitations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {invitations.length} invitee{invitations.length === 1 ? "" : "s"} haven&apos;t accepted yet.
          </Typography>
        </Box>
      </Stack>
      <Box>
        {invitations.map((inv) => (
          <Stack
            key={inv.id}
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ sm: "center" }}
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: 1,
              borderColor: "divider",
              "&:first-of-type": { borderTop: 0 },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {inv.full_name?.trim() || inv.email}
                </Typography>
                <StatusPill label={roleLabel(inv.role)} tone={roleTone(inv.role)} dot={false} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={inv.kind === "existing" ? "Awaiting in-app accept" : "Awaiting signup"}
                  sx={{ height: 22 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {inv.email} · {formatExpiry(inv.expires_at)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <form action={resendOrgInvitationAction}>
                <input type="hidden" name="invitationId" value={inv.id} />
                <Tooltip title="Resend invitation">
                  <IconButton size="small" type="submit" color="primary">
                    <SendRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </form>
              <form action={cancelOrgInvitationAction}>
                <input type="hidden" name="invitationId" value={inv.id} />
                <Tooltip title="Cancel invitation">
                  <IconButton size="small" type="submit" color="error">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </form>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

function InviteMemberDialog({
  open,
  orgName,
  onClose,
}: {
  open: boolean;
  orgName: string | null;
  onClose: () => void;
}) {
  const formId = "invite-member-form";
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        Add user
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          {orgName ? <>Invite a new member to <strong>{orgName}</strong>.</> : "Invite a new member to your organization."}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }} aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack id={formId} component="form" action={inviteOrgMemberAction} spacing={2.25} onSubmit={() => setTimeout(onClose, 0)}>
          <TextField name="email" type="email" label="Email address" required fullWidth size="small" margin="none" autoComplete="off" placeholder="teammate@example.com" />
          <TextField name="fullName" label="Full name (optional)" fullWidth size="small" margin="none" autoComplete="off" />
          <TextField name="role" label="Role" select required defaultValue="staff" fullWidth size="small" margin="none">
            {ORG_ROLE_OPTIONS.map((r) => (
              <MenuItem key={r.slug} value={r.slug}>
                <Stack spacing={0.25}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StatusPill label={r.label} tone={roleTone(r.slug)} dot={false} />
                    {r.slug === "staff" ? (
                      <Typography variant="caption" color="text.disabled">
                        default
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {r.description}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            name="message"
            label="Add a personal note (optional)"
            fullWidth
            size="small"
            margin="none"
            multiline
            minRows={2}
            placeholder="Welcome to the team!"
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
              <strong>If they don&apos;t have an account</strong>, we&apos;ll email them a secure link to create
              one — they&apos;ll join {orgName ? <strong>{orgName}</strong> : "your organization"} as soon as
              they finish signup.
              <br />
              <strong>If they already have an account</strong>, the invitation lands in their notification
              bell and they accept it from there.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form={formId} variant="contained" startIcon={<PersonAddAlt1RoundedIcon />}>
          Send invite
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditMemberDialog({
  member,
  currentUserId,
  onClose,
}: {
  member: TeamMember | null;
  currentUserId: string;
  onClose: () => void;
}) {
  const formId = "edit-member-form";
  return (
    <Dialog open={Boolean(member)} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pr: 6 }}>
        Edit member
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Update teammate profile and role.
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }} aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      {member ? (
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack id={formId} component="form" action={updateOrgMemberDetailsAction} spacing={2.25} onSubmit={() => setTimeout(onClose, 0)}>
            <input type="hidden" name="userId" value={member.id} />

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
                {monogramFor(member)}
              </Box>
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {member.full_name?.trim() || "No name"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {member.email}
                </Typography>
              </Stack>
            </Stack>

            <TextField name="fullName" label="Full name" defaultValue={member.full_name ?? ""} fullWidth size="small" margin="none" autoComplete="off" />

            <TextField name="role" label="Role" select required defaultValue={member.role} fullWidth size="small" margin="none" disabled={member.id === currentUserId}>
              {ORG_ROLE_OPTIONS.map((r) => (
                <MenuItem key={r.slug} value={r.slug}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <StatusPill label={r.label} tone={roleTone(r.slug)} dot={false} />
                    <Typography variant="caption" color="text.secondary">
                      {r.description}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {member.id === currentUserId ? (
              <Typography variant="caption" color="text.disabled">
                You can&apos;t demote yourself. Have another org admin update your role.
              </Typography>
            ) : null}
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

function RemoveMemberDialog({
  member,
  orgName,
  onClose,
}: {
  member: TeamMember | null;
  orgName: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(member)} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>Remove from organization?</DialogTitle>
      <Divider />
      {member ? (
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{member.full_name?.trim() || member.email}</strong> will be detached from{" "}
            <strong>{orgName ?? "your organization"}</strong>. Their account is not deleted — you can invite them back at
            any time.
          </Typography>
        </DialogContent>
      ) : null}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {member ? (
          <form action={removeOrgMemberAction} onSubmit={() => setTimeout(onClose, 0)}>
            <input type="hidden" name="userId" value={member.id} />
            <Button type="submit" color="error" variant="contained" startIcon={<PersonRemoveRoundedIcon />}>
              Remove
            </Button>
          </form>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
