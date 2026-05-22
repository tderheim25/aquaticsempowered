import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { completeAccountSetupAction } from "@/app/(dashboard)/app/needs-profile/actions";
import { getSessionUser, getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { provisionUserProfileFromSession } from "@/lib/auth/provisionProfile";

export const metadata = {
  title: "Finish setup | Aquatics Empowered",
};

export default async function NeedsProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  const { status } = await searchParams;

  if (user) {
    let profile = await getUsersRowWithAdminFallback(user.id);
    if (!profile) {
      profile = await provisionUserProfileFromSession();
    }
    if (profile) {
      if (profile.role === "super_admin" || profile.role === "support_technician") {
        redirect(profile.role === "support_technician" ? "/portal/queue" : "/app");
      }
      redirect(profile.org_id ? "/app" : "/app/no-organization");
    }
  }

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Account setup required
            </Typography>
            {status === "failed" ? (
              <Alert severity="error">
                We could not finish setup automatically. Try the button below again, or contact support with your user
                id.
              </Alert>
            ) : (
              <Alert severity="info">
                You are signed in, but we could not load your existing account profile (this can happen right after a
                database update). Try <strong>Complete setup</strong> to reload your profile — it will not change your
                role if you already have an account. New users can also use this to finish signup.
              </Alert>
            )}
            {user ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                Session user id: {user.id}
                <br />
                Email: {user.email ?? "(none)"}
              </Typography>
            ) : (
              <Typography variant="body2" color="error">
                No session — try signing out and signing in again.
              </Typography>
            )}
            <form action={completeAccountSetupAction}>
              <Button type="submit" variant="contained" fullWidth disabled={!user}>
                Complete setup
              </Button>
            </form>
            <form action={signOut}>
              <Button type="submit" variant="outlined" fullWidth>
                Sign out
              </Button>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
