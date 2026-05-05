import { Alert, Button, Container, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";

import { updateUserRoleAction } from "@/app/(dashboard)/app/admin/users/actions";
import { createAppRoleAction } from "@/app/(dashboard)/app/admin/permissions/actions";
import { RoleManagementPanel } from "@/components/admin/RoleManagementPanel";
import { isMissingAppRoleIdColumnError, requireRole } from "@/lib/auth/rbac";
import { ALL_ROLES, ALL_VIEW_KEYS, VIEW_DEFINITIONS, type AppViewKey, requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

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

  const flash = section === "permissions" ? permissionsStatusMessage(status) : usersStatusMessage(status);
  const admin = createAdminClient();

  const { data: appRoles } = await admin
    .from("app_roles")
    .select("id, slug, label, permissions_base, is_builtin, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  let usersQuery = await admin
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
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Organizations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon: organization-level controls and ownership.
            </Typography>
          </Paper>
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
