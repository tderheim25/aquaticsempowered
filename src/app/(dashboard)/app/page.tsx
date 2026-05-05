import { Card, CardActionArea, CardContent, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile, requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Aquatics Empowered",
};

function toFirstName(fullName: string | null | undefined, email: string | null | undefined) {
  const fromFullName = fullName?.trim().split(/\s+/)[0];
  const raw = fromFullName || email?.split("@")[0] || "Operator";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default async function DashboardHomePage() {
  await requireViewAccess("dashboard_home");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUsersRowForAuthUser(user.id) : null;
  const allowedViews = await getAllowedViewsForProfile(
    profile ? { role: profile.role, app_role_id: profile.app_role_id } : null
  );
  const canOpenAdmin = allowedViews.includes("admin_portal");
  const firstName = toFirstName(profile?.full_name, user?.email);

  const comingSoonAreas = [
    "Chemical Logs",
    "Maintenance",
    "Support Center",
    "Vendor Directory",
    "Community",
    "Procurement",
    "Training / CPO",
    "Monitoring",
  ];

  const adminAreas = [
    { title: "Users", href: "/app/admin?section=users", description: "Manage user accounts and assign system roles." },
    { title: "Organizations", href: "/app/admin?section=organizations", description: "Organization controls and ownership." },
    { title: "Permissions", href: "/app/admin?section=permissions", description: "Configure role and view access." },
    { title: "Billing", href: "/app/admin?section=billing", description: "Subscription and plan administration." },
  ];

  return (
    <Container maxWidth="lg">
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Welcome {firstName}
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Signed in as <strong>{user?.email}</strong>
            </Typography>
          </CardContent>
        </Card>

        {canOpenAdmin ? (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Admin Portal
              </Typography>
              <Grid container spacing={1.5}>
                {adminAreas.map((area) => (
                  <Grid key={area.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card variant="outlined" sx={{ height: 140 }}>
                      <CardActionArea component={Link} href={area.href} sx={{ height: "100%" }}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {area.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {area.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Upcoming Tools
            </Typography>
            <Grid container spacing={1.25}>
              {comingSoonAreas.map((area) => (
                <Grid key={area} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, py: 1 }}>
                    <Typography variant="body2">{area}</Typography>
                    <Chip label="Soon" size="small" />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
