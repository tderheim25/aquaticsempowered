"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";

import {
  createOrganizationAction,
  updateOrganizationAction,
  updateUserOrgAssignmentAction,
} from "@/app/private/ae-console/organizations/actions";
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
import type { Json, OrgTier, PlanCode } from "@/types/database";

const ORG_TIER_VALUES: readonly OrgTier[] = [
  "rural",
  "municipal",
  "hotel",
  "school",
  "hospital",
  "hoa",
  "splash_pad",
  "wellness",
  "commercial",
  "therapy",
];

function tierMenuLabel(tier: OrgTier) {
  return tier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAddress(address: Json | null | undefined): string | null {
  if (!address || typeof address !== "object" || Array.isArray(address)) return null;
  const a = address as Record<string, string>;
  const parts = [
    a.line1,
    a.line2,
    [a.city, a.region].filter(Boolean).join(", "),
    a.postal_code,
    a.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export type AdminOrganizationRow = {
  id: string;
  name: string;
  tier: OrgTier | null;
  plan_code: PlanCode;
  founder: boolean;
  website_url: string | null;
  phone: string | null;
  address: Json;
  created_at: string;
  memberCount: number;
};

export type AdminPlanOption = {
  code: PlanCode;
  name: string;
};

export type AdminUserAssignmentRow = {
  id: string;
  email: string;
  org_id: string | null;
};

type OrganizationsConsoleSectionProps = {
  organizations: AdminOrganizationRow[];
  planOptions: AdminPlanOption[];
  users: AdminUserAssignmentRow[];
};

function planLabel(planOptions: AdminPlanOption[], code: PlanCode) {
  return planOptions.find((p) => p.code === code)?.name ?? code;
}

function OrgProfileDialog({
  org,
  planOptions,
  onClose,
}: {
  org: AdminOrganizationRow | null;
  planOptions: AdminPlanOption[];
  onClose: () => void;
}) {
  const address = org ? formatAddress(org.address) : null;

  return (
    <Dialog
      open={Boolean(org)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Organization profile
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Read-only facility details.
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
      {org ? (
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                {org.name.slice(0, 2)}
              </Box>
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {org.name}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <StatusPill label={planLabel(planOptions, org.plan_code)} tone="primary" dot={false} />
                  {org.tier ? (
                    <StatusPill label={tierMenuLabel(org.tier)} tone="neutral" dot={false} />
                  ) : null}
                  {org.founder ? <Chip size="small" label="Founder" color="secondary" /> : null}
                </Stack>
              </Stack>
            </Stack>

            <Stack spacing={1.5}>
              <ProfileField label="Organization ID" value={org.id} mono />
              <ProfileField label="Facility type" value={org.tier ? tierMenuLabel(org.tier) : "Not set"} />
              <ProfileField label="Plan" value={planLabel(planOptions, org.plan_code)} />
              <ProfileField label="Members" value={String(org.memberCount)} />
              <ProfileField label="Phone" value={org.phone} />
              <ProfileField
                label="Website"
                value={org.website_url}
                href={org.website_url ? normalizeUrl(org.website_url) : undefined}
              />
              <ProfileField label="Address" value={address} />
              <ProfileField label="Created" value={<TableDateTimeCell iso={org.created_at} />} />
            </Stack>
          </Stack>
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function ProfileField({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <Stack spacing={0.35}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      {empty ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
          —
        </Typography>
      ) : href ? (
        <Typography
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          {value}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={mono ? { fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" } : undefined}
        >
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function OrganizationsConsoleSection({
  organizations,
  planOptions,
  users,
}: OrganizationsConsoleSectionProps) {
  const [viewingOrg, setViewingOrg] = useState<AdminOrganizationRow | null>(null);

  return (
    <Stack spacing={2}>
      <AeConsolePanel>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          New organization
        </Typography>
        <Stack
          component="form"
          action={createOrganizationAction}
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "flex-end" }}
        >
          <TextField name="name" label="Facility name" required fullWidth size="small" />
          <TextField name="tier" label="Type" select size="small" defaultValue="__none__" sx={{ minWidth: 160 }}>
            <MenuItem value="__none__">Not set</MenuItem>
            {ORG_TIER_VALUES.map((t) => (
              <MenuItem key={t} value={t}>
                {tierMenuLabel(t)}
              </MenuItem>
            ))}
          </TextField>
          <TextField name="plan_code" label="Plan" select size="small" defaultValue="free" sx={{ minWidth: 140 }}>
            {planOptions.map((p) => (
              <MenuItem key={p.code} value={p.code}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained">
            Create
          </Button>
        </Stack>
      </AeConsolePanel>

      <AeConsolePanel noPadding sx={{ overflowX: "auto" }}>
        {organizations.map((org) => (
          <form key={org.id} id={`org-${org.id}`} action={updateOrganizationAction} hidden />
        ))}
        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Members</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack alignItems="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No organizations yet. Create one above.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => {
                const fid = `org-${org.id}`;
                return (
                  <TableRow key={org.id} hover>
                    <TableCell>
                      <input type="hidden" name="orgId" value={org.id} form={fid} />
                      <TextField
                        name="name"
                        size="small"
                        defaultValue={org.name}
                        fullWidth
                        required
                        inputProps={{ form: fid }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        name="tier"
                        select
                        size="small"
                        defaultValue={org.tier ?? "__none__"}
                        sx={{ minWidth: 140 }}
                        inputProps={{ form: fid }}
                      >
                        <MenuItem value="__none__">Not set</MenuItem>
                        {ORG_TIER_VALUES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {tierMenuLabel(t)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        name="plan_code"
                        select
                        size="small"
                        defaultValue={org.plan_code}
                        sx={{ minWidth: 140 }}
                        inputProps={{ form: fid }}
                      >
                        {planOptions.map((p) => (
                          <MenuItem key={p.code} value={p.code}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <input type="hidden" name="founder" value={org.founder ? "on" : ""} form={fid} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                        {org.memberCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TableRowActions>
                        <Tooltip title="View organization profile">
                          <IconButton size="small" onClick={() => setViewingOrg(org)} aria-label="View organization profile">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button type="submit" form={fid} variant="outlined" size="small">
                          Save
                        </Button>
                      </TableRowActions>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </DataTable>
      </AeConsolePanel>

      <OrgProfileDialog org={viewingOrg} planOptions={planOptions} onClose={() => setViewingOrg(null)} />

      <AeConsolePanel noPadding sx={{ overflowX: "auto" }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Assign users to organization
          </Typography>
        </Box>
        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <TablePrimaryCell primary={user.email} />
                </TableCell>
                <TableCell>
                  <form id={`assign-${user.id}`} action={updateUserOrgAssignmentAction} hidden />
                  <input type="hidden" name="userId" value={user.id} form={`assign-${user.id}`} />
                  <TextField
                    select
                    size="small"
                    name="orgId"
                    defaultValue={user.org_id ?? "__unassigned__"}
                    sx={{ minWidth: 220 }}
                    inputProps={{ form: `assign-${user.id}` }}
                  >
                    <MenuItem value="__unassigned__">Unassigned</MenuItem>
                    {organizations.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="right">
                  <Button type="submit" form={`assign-${user.id}`} size="small" variant="outlined">
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </AeConsolePanel>
    </Stack>
  );
}
