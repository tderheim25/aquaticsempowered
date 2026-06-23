import { Box, Card, CardContent, Container, Stack } from "@mui/material";

import { FounderApplyWizard } from "@/components/marketing/FounderApplyWizard";
import { FounderHero } from "@/components/marketing/founders/FounderHero";
import { FounderTrustSidebar } from "@/components/marketing/founders/FounderTrustSidebar";
import { FounderValueBento } from "@/components/marketing/founders/FounderValueBento";
import { FounderProgramStatusCard } from "@/components/marketing/FounderProgramStatusCard";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { resolveFounderProgramGate, type FounderProgramGate } from "@/lib/founders/founderProgramGate";
import { getSitePromoConfig } from "@/lib/marketing/sitePromo";
import { buildDisplayName } from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Founder Program | Aquatics Empowered",
};

function parseDefaultPlan(plan: string | undefined): "essential" | "pro" {
  if (plan === "essential" || plan === "professional" || plan === "pro") {
    return plan === "essential" ? "essential" : "pro";
  }
  return "pro";
}

export default async function FoundersPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const defaultPlanCode = parseDefaultPlan(params.plan);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: { id: string; email: string; displayName: string | null } | null = null;
  let founderGate: FounderProgramGate = { eligible: true };
  const sitePromo = await getSitePromoConfig();

  if (user) {
    const profile = await getUsersRowWithAdminFallback(user.id);
    founderGate = profile ? await resolveFounderProgramGate(profile) : { eligible: true };
    currentUser = {
      id: user.id,
      email: user.email ?? profile?.email ?? "",
      displayName: profile
        ? buildDisplayName({
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: profile.full_name,
            email: profile.email,
          })
        : null,
    };
  }

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <FounderHero sitePromo={sitePromo} />
      <FounderValueBento sitePromo={sitePromo} />

      <Box
        component="section"
        id="founder-apply"
        sx={{
          scrollMarginTop: { xs: 80, md: 96 },
          py: { xs: 5, md: 7 },
          background:
            "linear-gradient(180deg, rgba(245,247,250,1) 0%, rgba(0,59,111,0.04) 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
            <Box sx={{ flex: 1.6, minWidth: 0, width: "100%" }}>
              <Card
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 4,
                  boxShadow: "0 22px 60px rgba(15, 23, 42, 0.08)",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
                  {founderGate.eligible ? (
                    <FounderApplyWizard
                      currentUser={currentUser}
                      sitePromo={sitePromo}
                      defaultPlanCode={defaultPlanCode}
                    />
                  ) : (
                    <FounderProgramStatusCard status={founderGate} />
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1, minWidth: { md: 280 }, width: "100%" }}>
              <FounderTrustSidebar />
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
