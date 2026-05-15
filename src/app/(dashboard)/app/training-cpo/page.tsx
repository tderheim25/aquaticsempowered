import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { hasFeature } from "@/lib/auth/plans";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/types/database";

export const metadata = {
  title: "Training / CPO | Aquatics Empowered",
};

const REFERENCE_LINKS: { title: string; href: string; description: string }[] = [
  {
    title: "CDC Model Aquatic Health Code (MAHC)",
    href: "https://www.cdc.gov/mahc/editions/index.html",
    description: "Evidence-based guidance for design, maintenance, and operation of public aquatic venues.",
  },
  {
    title: "CDC Healthy Swimming",
    href: "https://www.cdc.gov/healthywater/swimming/index.html",
    description: "Disinfection, hygiene, and outbreak prevention for aquatic facilities.",
  },
  {
    title: "PHTA — Pool & Hot Tub Alliance",
    href: "https://www.phta.org/",
    description: "Industry standards and education pathways, including CPO certification information.",
  },
];

const STUDY_TOPICS = [
  "Water balance: pH, alkalinity, calcium hardness, and temperature effects on sanitizer performance.",
  "Disinfection: chlorine vs. bromine, combined chlorine, breakpoint chlorination, and cyanuric acid.",
  "Filtration and circulation: turnover, hydraulics, backwashing, and filter media care.",
  "Health and safety: chemical storage and handling, signage, emergency response, and patron education.",
  "Regulatory awareness: local health codes, recordkeeping, and inspection readiness.",
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
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Training / CPO
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Certified Pool Operator (CPO) programs verify that operators can maintain safe water and compliant facilities.
            Use this hub for study structure and authoritative references—formal certification is awarded by accredited
            course providers after you complete their class and exam.
          </Typography>
        </Box>

        {!trainingUnlocked ? (
          <Alert severity="info">
            In-depth training tracks and org-wide completion reporting are included on Professional and Enterprise plans.
            You can still use the outline and public resources below.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        ) : null}

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Suggested study outline
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Aligns with common CPO curricula; use it alongside your provider&apos;s manual and local code.
            </Typography>
            <List dense disablePadding>
              {STUDY_TOPICS.map((text) => (
                <ListItem key={text} disableGutters sx={{ py: 0.5, alignItems: "flex-start" }}>
                  <ListItemText primary={text} primaryTypographyProps={{ variant: "body2" }} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Authoritative references
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              External sites open in a new tab.
            </Typography>
            <Stack spacing={2}>
              {REFERENCE_LINKS.map((ref, i) => (
                <Box key={ref.href}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {ref.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
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
                Coming next: assign training modules, log renewal dates for staff CPO cards, and export compliance
                summaries for your health department binder.
              </Typography>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
