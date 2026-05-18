import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Alert, Box, Button, Card, CardContent, Container, Divider, Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { TrainingCourseCatalog, type TrainingCoursePreview } from "@/components/training/TrainingCourseCatalog";
import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Training / CPO | Aquatics Empowered",
};

const IMG = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=720&q=80`;

/** Temporary catalog — swap titles, durations, and artwork when LMS content is wired in. */
const PLACEHOLDER_COURSES: TrainingCoursePreview[] = [
  {
    id: "water-balance",
    title: "Water Balance & Field Testing",
    subtitle: "pH, total alkalinity, calcium hardness, and temperature — how each reading drives sanitizer performance.",
    category: "Chemistry",
    durationLabel: "22 min",
    thumbnailUrl: IMG("photo-1558618666-fcd25c85cd64"),
    thumbnailAlt: "Close-up water surface with soft light reflections",
  },
  {
    id: "chlorine-disinfection",
    title: "Chlorine Chemistry & Combined Chlorine",
    subtitle: "Free vs. combined chlorine, breakpoint basics, cyanuric acid, and stabilization tradeoffs.",
    category: "Disinfection",
    durationLabel: "28 min",
    thumbnailUrl: IMG("photo-1575429198097-0414ec08e8cd"),
    thumbnailAlt: "Outdoor swimming pool with clear blue water",
  },
  {
    id: "filtration-turnover",
    title: "Filtration, Circulation & Turnover",
    subtitle: "Pump curves, hydraulic balance, turnover goals, filter media care, and backwashing pitfalls.",
    category: "Operations",
    durationLabel: "26 min",
    thumbnailUrl: IMG("photo-1519710164239-da123dc03ef4"),
    thumbnailAlt: "Pool equipment area with pumps",
  },
  {
    id: "chemical-safety",
    title: "Chemical Safety & Incident Response",
    subtitle: "Storage segregation, dosing PPE, spill kits, SDS access, and what to rehearse before season start.",
    category: "Safety",
    durationLabel: "19 min",
    thumbnailUrl: IMG("photo-1581092795360-fd1ca04f0952"),
    thumbnailAlt: "Industrial safety equipment blurred background",
  },
  {
    id: "mauc-overview",
    title: "MAHC-Aligned Venue Operations",
    subtitle: "Model Aquatic Health Code themes adapted to daily rounds, logs, and health-inspection readiness.",
    category: "Compliance",
    durationLabel: "24 min",
    thumbnailUrl: IMG("photo-1530549387789-4c1017266635"),
    thumbnailAlt: "Swimming pool lanes from above",
  },
  {
    id: "spas-hydrotherapy",
    title: "Spas & Hydrotherapy: Bromine Essentials",
    subtitle: "High-temperature bath dynamics, bromine vs. chlorine in hot water, ventilation, and drain safety.",
    category: "Aquatic venues",
    durationLabel: "21 min",
    thumbnailUrl: IMG("photo-1600596542815-ffad4c1539a9"),
    thumbnailAlt: "Steam rising from spa water surface",
  },
  {
    id: "facility-rounds",
    title: "Daily Rounds for Multi-Basin Facilities",
    subtitle: "Splash pads, wading pools, and main basin priorities — patrol patterns and documentation stubs.",
    category: "Management",
    durationLabel: "17 min",
    thumbnailUrl: IMG("photo-1566073771259-6a8506099945"),
    thumbnailAlt: "Resort swimming pool overlooking ocean",
  },
  {
    id: "cpo-exam-bridge",
    title: "CPO Exam Scenario Bridge",
    subtitle: "Sample calculation walkthroughs and table lookups you would expect before a certification exam.",
    category: "Cert prep",
    durationLabel: "31 min",
    thumbnailUrl: IMG("photo-1498747946579-bd2883c83700"),
    thumbnailAlt: "Person wearing goggles resting at pool edge",
  },
];

const REFERENCE_LINKS: { title: string; href: string; description: string }[] = [
  {
    title: "CDC Model Aquatic Health Code (MAHC)",
    href: "https://www.cdc.gov/mahc/editions/index.html",
    description: "Evidence-based guidance for design, maintenance, and operation of public aquatic venues.",
  },
  {
    title: "CDC Healthy Swimming",
    href: "https://www.cdc.gov/healthywater/swimming/index.html",
    description: "Disinfection, hygiene, and outbreak prevention.",
  },
  {
    title: "PHTA — Pool & Hot Tub Alliance",
    href: "https://www.phta.org/",
    description: "Standards paths and certification program information.",
  },
];

export default async function TrainingCpoPage() {
  await requireViewAccess("training_cpo");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUsersRowForAuthUser(user.id) : null;

  let planCode: PlanCode = "free";
  if (profile?.org_id) {
    const { data: org } = await supabase.from("organizations").select("plan_code").eq("id", profile.org_id).maybeSingle();
    planCode = (org?.plan_code as PlanCode) ?? "free";
  }

  const trainingUnlocked = profile?.role === "super_admin" || hasFeature(planCode, "training");

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Training / CPO
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore pool-focused and aquatic-venue lessons built around Certified Pool Operator standards. Lesson playback
            and progress tracking will connect here soon—cards below use sample titles and stock imagery as placeholders.
          </Typography>
        </Box>

        {!trainingUnlocked ? (
          <Alert severity="info">
            Structured org tracks and completion reporting land on upgraded plans—you can still browse the curriculum
            layout below.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Course library
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Temporary modules — thumbnails and durations are illustrative until video assets are uploaded.
              </Typography>
            </Stack>
            <TrainingCourseCatalog courses={PLACEHOLDER_COURSES} />
          </Stack>
        </Paper>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Authoritative references
            </Typography>
            <Stack spacing={2}>
              {REFERENCE_LINKS.map((ref, i) => (
                <Box key={ref.href}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {ref.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                    {ref.description}
                  </Typography>
                  <Button
                    component={MuiLink}
                    href={ref.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                  >
                    Open resource
                  </Button>
                  {i < REFERENCE_LINKS.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {trainingUnlocked ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Organization tools (roadmap)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assign modules per role, attach proof of renewal, export training logs for auditors, and drill into quiz
                results by site.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
