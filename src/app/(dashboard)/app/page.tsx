import { Card, CardContent, Container, Typography } from "@mui/material";

import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Aquatics Empowered",
};

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your dashboard is being built. Chemical logs, maintenance, support, and vendor tools will appear here as we
            ship each feature.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Signed in as <strong>{user?.email}</strong>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
