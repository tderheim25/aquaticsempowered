import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { redirect } from "next/navigation";

import { resolveActiveOrgId } from "@/lib/auth/activeOrg";
import { getCurrentProfile } from "@/lib/auth/rbac";

export const metadata = {
  title: "Organization required | Aquatics Empowered",
};

export default async function NoOrganizationPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/app/needs-profile");
  }
  const activeOrgId = await resolveActiveOrgId(profile);
  if (profile.org_id || activeOrgId) {
    redirect("/app");
  }

  const isSuperAdmin = profile.role === "super_admin";

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {isSuperAdmin ? "Select a facility" : "Organization required"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSuperAdmin
                ? "Super admins are not tied to one organization. Use the organization switcher at the top of the sidebar to work in a facility’s context, then open Pools, Maintenance, or Support."
                : "Pools, maintenance, and other facility tools need an organization. You can still use Support Center to submit a help request anytime."}
            </Typography>
            {isSuperAdmin ? (
              <Alert severity="info">
                Platform-wide tools are in <strong>AE Console</strong> (sidebar). Facility tools unlock after you pick an
                organization.
              </Alert>
            ) : (
              <Alert severity="info">
                Ask your organization administrator to add you to their facility, or open{" "}
                <Link href="/app/support" style={{ fontWeight: 600 }}>
                  Support Center
                </Link>{" "}
                to request help.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button component={Link} href="/app" variant="contained" fullWidth>
                Back to dashboard
              </Button>
              {isSuperAdmin ? (
                <Button component={Link} href="/private/ae-console" variant="outlined" fullWidth>
                  AE Console
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
