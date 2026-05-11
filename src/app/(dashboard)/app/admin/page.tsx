import {
  Alert,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  createOrganizationAction,
  updateOrganizationAction,
  updateUserOrgAssignmentAction,
} from "@/app/(dashboard)/app/admin/organizations/actions";
import { createAppRoleAction } from "@/app/(dashboard)/app/admin/permissions/actions";
import { updateUserRoleAction } from "@/app/(dashboard)/app/admin/users/actions";
import { RoleManagementPanel } from "@/components/admin/RoleManagementPanel";
import { isMissingAppRoleIdColumnError, requireRole } from "@/lib/auth/rbac";
import { ALL_ROLES, ALL_VIEW_KEYS, VIEW_DEFINITIONS, type AppViewKey, requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrgTier, PlanCode, UserRole } from "@/types/database";

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

export const metadata = {
  title: "Admin | Aquatics Empowered",
};

function usersStatusMessage(status?: string) {
  switch (status) {
    case "updated":
      return { severity: "success" as const, text: "User role updated successfully." };
    case "self":
      return { severity: "warning" as const, text: "You cannot remove your own super admin access from this screen." };
    case "invalid":
      return { severity: "error" as const, text: "Invalid role update request." };
    case "error":
      return { severity: "error" as const, text: "Unable to update role. Please try again." };
    default:
      return null;
  }
}

function permissionsStatusMessage(status?: string) {
  switch (status) {
    case "updated":
      return { severity: "success" as const, text: "View permissions updated." };
    case "role_created":
      return { severity: "success" as const, text: "New role created. Assign it to users and adjust views below." };
    case "role_updated":
      return { severity: "success" as const, text: "Role updated." };
    case "role_deleted":
      return { severity: "success" as const, text: "Role removed." };
    case "role_in_use":
      return { severity: "warning" as const, text: "This role is assigned to users. Reassign those users first, then delete the role." };
    case "builtin_locked":
      return { severity: "warning" as const, text: "Built-in roles cannot be edited or removed." };
    case "invalid":
      return { severity: "error" as const, text: "Invalid request." };
    case "error":
      return { severity: "error" as const, text: "Could not save. Please try again." };
    default:
      return null;
  }
}

function parseViews(input: string[]) {
  return input.filter((key) => ALL_VIEW_KEYS.includes(key as (typeof ALL_VIEW_KEYS)[number]));
}

function organizationsStatusMessage(status?: string) {
  switch (status) {
    case "created":
      return { severity: "success" as const, text: "Organization created." };
    case "updated":
      return { severity: "success" as const, text: "Organization saved." };
    case "assigned":
      return { severity: "success" as const, text: "User organization assignment updated." };
    case "invalid":
      return { severity: "error" as const, text: "Invalid organization request." };
    case "error":
      return { severity: "error" as const, text: "Something went wrong. Please try again." };
    default:
      return null;
  }
}

type Section = "users" | "organizations" | "permissions" | "billing";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; status?: string }>;
}) {
  await requireRole("super_admin");
  await requireViewAccess("admin_portal");
  const { section: rawSection, status } = await searchParams;
  const section: Section = rawSection === "users" || rawSection === "organizations" || rawSection === "permissions" || rawSection === "billing" ? rawSection : "users";

  const flash =
    section === "permissions"
      ? permissionsStatusMessage(status)
      : section === "organizations"
        ? organizationsStatusMessage(status)
        : usersStatusMessage(status);
  const admin = createAdminClient();

  const { data: appRoles } = await admin
    .from("app_roles")
    .select("id, slug, label, permissions_base, is_builtin, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const usersQuery = await admin
    .from("users")
    .select("id, email, full_name, org_id, role, app_role_id, created_at")
    .order("created_at", { ascending: false });

  let users = usersQuery.data;
  if (usersQuery.error && isMissingAppRoleIdColumnError(usersQuery.error.message)) {
    const fallback = await admin
      .from("users")
      .select("id, email, full_name, org_id, role, created_at")
      .order("created_at", { ascending: false });
    users = (fallback.data ?? []).map((u) => ({ ...u, app_role_id: null as string | null }));
  }

  const orgIds = [...new Set((users ?? []).map((u) => u.org_id).filter((id): id is string => Boolean(id)))];
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] as { id: string; name: string }[] };
  const orgNameById = new Map((orgs ?? []).map((org) => [org.id, org.name]));
  const slugToId = new Map((appRoles ?? []).map((r) => [r.slug, r.id]));

  const roleList = (appRoles ?? []) as {
    id: string;
    slug: string;
    label: string;
    permissions_base: UserRole;
    is_builtin: boolean;
  }[];
  const roleIds = roleList.map((r) => r.id);
  const { data: permRows } =
    roleIds.length > 0
      ? await admin.from("app_role_view_permissions").select("role_id, view_key, can_view").in("role_id", roleIds)
      : { data: [] as { role_id: string; view_key: string; can_view: boolean }[] };

  const selectedByRoleId = new Map<string, Set<string>>();
  for (const r of roleList) {
    selectedByRoleId.set(r.id, new Set());
  }
  for (const row of permRows ?? []) {
    if (!row.can_view) continue;
    if (!selectedByRoleId.has(row.role_id)) continue;
    const parsed = parseViews([row.view_key]);
    if (parsed.length > 0) {
      selectedByRoleId.get(row.role_id)!.add(parsed[0]);
    }
  }
  const selectedByRoleIdRecord: Record<string, AppViewKey[]> = {};
  for (const role of roleList) {
    selectedByRoleIdRecord[role.id] = Array.from(selectedByRoleId.get(role.id) ?? new Set()) as AppViewKey[];
  }

  let organizationRows: {
    id: string;
    name: string;
    tier: OrgTier | null;
    plan_code: PlanCode;
    founder: boolean;
    created_at: string;
  }[] = [];
  let planOptions: { code: PlanCode; name: string }[] = [];

  if (section === "organizations") {
    const [orgsRes, plansRes] = await Promise.all([
      admin.from("organizations").select("id, name, tier, plan_code, founder, created_at").order("name", { ascending: true }),
      admin.from("plans").select("code, name").order("sort_order", { ascending: true }),
    ]);
    organizationRows = (orgsRes.data ?? []) as typeof organizationRows;
    planOptions = (plansRes.data ?? []) as typeof planOptions;
  }

  const memberCountByOrg = new Map<string, number>();
  const orgLabelById = new Map<string, string>();
  if (section === "organizations") {
    for (const o of organizationRows) {
      orgLabelById.set(o.id, o.name);
    }
    for (const u of users ?? []) {
      if (u.org_id) {
        memberCountByOrg.set(u.org_id, (memberCountByOrg.get(u.org_id) ?? 0) + 1);
      }
    }
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Admin Portal
          </Typography>
        </div>

        {section === "users" ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              User Management
            </Typography>
            {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(users ?? []).map((user) => {
                    const defaultAppRoleId = user.app_role_id ?? slugToId.get(user.role) ?? "";
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name?.trim() || "No name"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{(user.org_id && orgNameById.get(user.org_id)) ?? "Unassigned"}</TableCell>
                        <TableCell sx={{ minWidth: 280 }}>
                          <form action={updateUserRoleAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField select size="small" name="appRoleId" defaultValue={defaultAppRoleId || undefined} sx={{ minWidth: 220 }} required>
                                {(appRoles ?? []).map((r) => (
                                  <MenuItem key={r.id} value={r.id}>
                                    {r.label}
                                    {!r.is_builtin ? ` (${r.slug})` : ""}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <Button type="submit" variant="outlined">
                                Save
                              </Button>
                            </Stack>
                          </form>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        ) : null}

        {section === "permissions" ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Permissions
            </Typography>
            {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Add role
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                New roles copy view access from the base role you pick. You can adjust views after creation.
              </Typography>
              <Stack component="form" action={createAppRoleAction} direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }}>
                <TextField name="label" label="Role name" required fullWidth size="small" placeholder="e.g. Pool Auditor" />
                <TextField name="permissionsBase" label="Base (RLS)" select size="small" defaultValue="staff" sx={{ minWidth: 180 }}>
                  {ALL_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained">
                  Add role
                </Button>
              </Stack>
            </Paper>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Manage existing roles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a role to open modal controls for role details, views, and removal.
              </Typography>
              <RoleManagementPanel
                roles={roleList}
                selectedByRoleId={selectedByRoleIdRecord}
                allRoles={ALL_ROLES}
                viewDefinitions={VIEW_DEFINITIONS.map((view) => ({ key: view.key, label: view.label }))}
              />
            </Stack>
          </Stack>
        ) : null}

        {section === "organizations" ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Organizations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create facilities, set plan and tier, and assign users so accounts can access org-scoped tools.
              </Typography>
            </div>
            {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                New organization
              </Typography>
              <Stack component="form" action={createOrganizationAction} direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
                <TextField name="name" label="Facility name" required fullWidth size="small" placeholder="e.g. Riverside Aquatic Center" />
                <TextField name="tier" label="Facility type" select size="small" defaultValue="__none__" sx={{ minWidth: 200 }}>
                  <MenuItem value="__none__">Not set</MenuItem>
                  {ORG_TIER_VALUES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {tierMenuLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField name="plan_code" label="Plan" select size="small" defaultValue="free" sx={{ minWidth: 160 }}>
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
            </Paper>
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              {organizationRows.map((org) => (
                <form key={`org-form-${org.id}`} id={`org-form-${org.id}`} action={updateOrganizationAction} hidden />
              ))}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell align="center">Members</TableCell>
                    <TableCell align="center">Founder</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
                      Save
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {organizationRows.map((org) => {
                    const formId = `org-form-${org.id}`;
                    return (
                      <TableRow key={org.id}>
                        <TableCell sx={{ minWidth: 200 }}>
                          <input type="hidden" name="orgId" value={org.id} form={formId} />
                          <TextField
                            name="name"
                            size="small"
                            defaultValue={org.name}
                            fullWidth
                            required
                            slotProps={{ htmlInput: { form: formId } }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 160 }}>
                          <TextField
                            name="tier"
                            select
                            size="small"
                            defaultValue={org.tier ?? "__none__"}
                            fullWidth
                            slotProps={{ htmlInput: { form: formId } }}
                            SelectProps={{ inputProps: { form: formId } }}
                          >
                            <MenuItem value="__none__">Not set</MenuItem>
                            {ORG_TIER_VALUES.map((t) => (
                              <MenuItem key={t} value={t}>
                                {tierMenuLabel(t)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <TextField
                            name="plan_code"
                            select
                            size="small"
                            defaultValue={org.plan_code}
                            fullWidth
                            slotProps={{ htmlInput: { form: formId } }}
                            SelectProps={{ inputProps: { form: formId } }}
                          >
                            {planOptions.map((p) => (
                              <MenuItem key={p.code} value={p.code}>
                                {p.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell align="center">{memberCountByOrg.get(org.id) ?? 0}</TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="founder"
                                value="on"
                                defaultChecked={org.founder}
                                inputProps={{ form: formId }}
                              />
                            }
                            label=""
                            sx={{ m: 0 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(org.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button type="submit" form={formId} variant="outlined" size="small">
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Assign users to an organization
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Users without an organization are redirected away from maintenance and other facility features until they are linked here.
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current org</TableCell>
                    <TableCell sx={{ minWidth: 280 }}>Assign</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(users ?? []).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name?.trim() || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{(user.org_id && orgLabelById.get(user.org_id)) ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <form action={updateUserOrgAssignmentAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                              select
                              size="small"
                              name="orgId"
                              defaultValue={user.org_id ?? "__unassigned__"}
                              sx={{ minWidth: 240 }}
                              fullWidth
                            >
                              <MenuItem value="__unassigned__">Unassigned</MenuItem>
                              {organizationRows.map((o) => (
                                <MenuItem key={o.id} value={o.id}>
                                  {o.name}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Button type="submit" variant="outlined" size="small">
                              Save
                            </Button>
                          </Stack>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        ) : null}

        {section === "billing" ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Billing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon: subscription and plan administration tools.
            </Typography>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
