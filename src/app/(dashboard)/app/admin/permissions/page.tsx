import { Alert, Box, Button, Container, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";

import { RoleManagementPanel } from "@/components/admin/RoleManagementPanel";
import { requireRole } from "@/lib/auth/rbac";
import { ALL_ROLES, ALL_VIEW_KEYS, VIEW_DEFINITIONS, type AppViewKey, requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

import { createAppRoleAction } from "./actions";

export const metadata = {
  title: "Admin Permissions | Aquatics Empowered",
};

function statusMessage(status?: string) {
  switch (status) {
    case "updated":
      return { severity: "success" as const, text: "View permissions updated." };
    case "role_created":
      return { severity: "success" as const, text: "New role created. Assign it to users on the User Management page and adjust views below." };
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

type AppRoleRow = {
  id: string;
  slug: string;
  label: string;
  permissions_base: UserRole;
  is_builtin: boolean;
  sort_order: number;
};

export default async function AdminPermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireViewAccess("admin_portal");
  await requireRole("super_admin");
  const { status } = await searchParams;
  const flash = statusMessage(status);

  const admin = createAdminClient();
  const { data: appRoles, error: rolesError } = await admin
    .from("app_roles")
    .select("id, slug, label, permissions_base, is_builtin, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const roleList = (appRoles ?? []) as AppRoleRow[];

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
    const values = Array.from(selectedByRoleId.get(role.id) ?? new Set()) as AppViewKey[];
    selectedByRoleIdRecord[role.id] = values;
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Role View Permissions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add custom roles, then choose which dashboard views each role can access. Base permission sets Row-Level Security
            (inherit from an existing role).
          </Typography>
        </div>

        {rolesError ? (
          <Alert severity="warning">
            Could not load roles. Run <strong>supabase/migrations/0005_app_roles.sql</strong> in the Supabase SQL editor,
            then refresh.
          </Alert>
        ) : null}

        {flash ? <Alert severity={flash.severity}>{flash.text}</Alert> : null}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Add role
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            New roles copy view access from the base role you pick (you can change checkboxes after). Users keep JWT/RLS
            aligned via <strong>permissions base</strong>.
          </Typography>
          <Box component="form" action={createAppRoleAction}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-end" }}>
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
          </Box>
        </Paper>

        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Manage existing roles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a role to open a modal for role details, view access, and removal.
          </Typography>
          <RoleManagementPanel
            roles={roleList}
            selectedByRoleId={selectedByRoleIdRecord}
            allRoles={ALL_ROLES}
            viewDefinitions={VIEW_DEFINITIONS.map((view) => ({ key: view.key, label: view.label }))}
          />
        </Stack>
      </Stack>
    </Container>
  );
}
