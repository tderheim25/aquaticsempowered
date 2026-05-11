import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth/rbac";

export const metadata = {
  title: "Organization required | Aquatics Empowered",
};

export default async function NoOrganizationPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/app/needs-profile");
  }
  if (profile.org_id) {
    redirect("/app");
  }

  const isSuperAdmin = profile.role === "super_admin";

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Organization required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maintenance, Support Center, and other facility tools are tied to an organization. Your account does not
              have an <strong>organization</strong> assigned yet in <strong>public.users.org_id</strong>.
            </Typography>
            {isSuperAdmin ? (
              <Alert severity="info">
                As a super admin, open <strong>Admin → Organizations</strong> or <strong>Admin → Users</strong>, create
                or pick an organization, and set <strong>org_id</strong> on your user row (and sign out/in if the app
                still behaves oddly, so your session picks up the new JWT claims).
              </Alert>
            ) : (
              <Alert severity="info">
                Ask your organization administrator to add you to their facility in the app, or to assign your account
                to the correct organization in Supabase.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button component={Link} href="/app" variant="outlined" fullWidth>
                Back to dashboard
              </Button>
              {isSuperAdmin ? (
                <Button component={Link} href="/app/admin?section=organizations" variant="contained" fullWidth>
                  Admin: Organizations
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
