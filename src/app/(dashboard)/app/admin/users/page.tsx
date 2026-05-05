import { Alert, Button, Container, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";

import { isMissingAppRoleIdColumnError, requireRole } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createAdminClient } from "@/lib/supabase/admin";

import { updateUserRoleAction } from "./actions";

export const metadata = {
  title: "Admin Users | Aquatics Empowered",
};

function statusMessage(status?: string) {
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

export default async function AdminUsersPage({
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

  let usersQuery = await admin
    .from("users")
    .select("id, email, full_name, org_id, role, app_role_id, created_at")
    .order("created_at", { ascending: false });

  let users = usersQuery.data;
  if (usersQuery.error && isMissingAppRoleIdColumnError(usersQuery.error.message)) {
    const fb = await admin
      .from("users")
      .select("id, email, full_name, org_id, role, created_at")
      .order("created_at", { ascending: false });
    users = (fb.data ?? []).map((u) => ({ ...u, app_role_id: null as string | null }));
  }

  const orgIds = [...new Set((users ?? []).map((u) => u.org_id).filter((id): id is string => Boolean(id)))];
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] as { id: string; name: string }[] };
  const orgNameById = new Map((orgs ?? []).map((org) => [org.id, org.name]));

  const slugToId = new Map((appRoles ?? []).map((r) => [r.slug, r.id]));

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Assign an app role to each user. Custom roles are created on the Permissions page.
          </Typography>
        </div>

        {rolesError ? (
          <Alert severity="warning">
            Roles could not be loaded. Run <strong>supabase/migrations/0005_app_roles.sql</strong> in Supabase, then refresh.
          </Alert>
        ) : null}

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
                          <TextField
                            select
                            size="small"
                            name="appRoleId"
                            defaultValue={defaultAppRoleId || undefined}
                            sx={{ minWidth: 220 }}
                            required
                          >
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
    </Container>
  );
}
