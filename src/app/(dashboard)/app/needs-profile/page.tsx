import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";

import { signOut } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth/rbac";

export const metadata = {
  title: "Finish setup | Aquatics Empowered",
};

export default async function NeedsProfilePage() {
  const user = await getSessionUser();

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Account setup required
            </Typography>
            <Alert severity="info">
              You are signed in, but the app cannot load your row from <strong>public.users</strong> (same UUID as in
              Authentication → Users). Often this is a <strong>different account</strong> than the one in the table, or a
              brand‑new signup.
            </Alert>
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
            <Typography variant="body2" color="text.secondary">
              In Supabase → Table Editor → <strong>users</strong>, confirm a row whose <strong>id</strong> matches the
              UUID above. If it is missing, insert one (or sign in with an account that already has a row).
            </Typography>
            <form action={signOut}>
              <Button type="submit" variant="contained" fullWidth>
                Sign out
              </Button>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
