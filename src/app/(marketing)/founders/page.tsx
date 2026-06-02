import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Avatar, Box, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";

import { FounderApplyWizard } from "@/components/marketing/FounderApplyWizard";
import { FounderProgramStatusCard } from "@/components/marketing/FounderProgramStatusCard";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { resolveFounderProgramGate, type FounderProgramGate } from "@/lib/founders/founderProgramGate";
import { PROMO } from "@/lib/marketing/promo";
import { buildDisplayName } from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Founder Program | Aquatics Empowered",
};

const perks = [
  {
    icon: VerifiedRoundedIcon,
    title: "Preferred founder pricing",
    body: "Locked-in rates and contract terms reserved for the first 50 founder facilities.",
  },
  {
    icon: RocketLaunchRoundedIcon,
    title: "Concierge onboarding",
    body: "Direct line to our founding team to migrate logs, SOPs, and staff workflows.",
  },
  {
    icon: AutoAwesomeRoundedIcon,
    title: "Roadmap input",
    body: "Help shape chemical logging, maintenance, and reporting features for your facility type.",
  },
  {
    icon: EventAvailableRoundedIcon,
    title: "White-glove rollout",
    body: "Training, support, and early access to new modules before they ship publicly.",
  },
];

export default async function FoundersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: { id: string; email: string; displayName: string | null } | null = null;
  let founderGate: FounderProgramGate = { eligible: true };

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
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(0,59,111,0.06) 0%, rgba(46,165,160,0.04) 40%, rgba(245,247,250,1) 80%)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(900px 320px at 12% -10%, rgba(0,59,111,0.18), transparent 60%), radial-gradient(700px 320px at 88% -10%, rgba(46,165,160,0.22), transparent 60%)",
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 5, md: 8 } }}>
        <Stack spacing={1.5} sx={{ maxWidth: 720, mb: { xs: 4, md: 6 } }}>
          <Chip
            label="Founder Program · First 50 facilities"
            size="small"
            sx={{
              alignSelf: "flex-start",
              fontWeight: 700,
              bgcolor: "secondary.main",
              color: "common.white",
              letterSpacing: "0.04em",
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Build the future of aquatics with us.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tell us about your facility and choose how to move forward — create your founder account
            today or book a personalized demo with our team. Either way, you&apos;re joining the operators
            shaping the playbook.
          </Typography>

          {PROMO.active ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                mt: 1,
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
                background: "linear-gradient(135deg, rgba(0,59,111,0.06), rgba(46,165,160,0.1))",
                border: "1px solid rgba(46,165,160,0.3)",
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  bgcolor: "secondary.main",
                  color: "common.white",
                  boxShadow: "0 8px 20px rgba(46,165,160,0.4)",
                }}
              >
                <LocalOfferRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, color: "primary.dark" }}>
                  {PROMO.headline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {PROMO.description}
                </Typography>
              </Box>
            </Stack>
          ) : null}
        </Stack>

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
                  <FounderApplyWizard currentUser={currentUser} />
                ) : (
                  <FounderProgramStatusCard status={founderGate} />
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1, minWidth: { md: 280 }, width: "100%" }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.16em" }}>
                What founders get
              </Typography>
              {perks.map((perk) => (
                <Stack key={perk.title} direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 36,
                      height: 36,
                      boxShadow: "0 6px 18px rgba(0,59,111,0.25)",
                    }}
                  >
                    <perk.icon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {perk.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {perk.body}
                    </Typography>
                  </Box>
                </Stack>
              ))}

              <Card
                variant="outlined"
                sx={{ borderRadius: 3, mt: 1, borderColor: "divider", backgroundColor: "background.paper" }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Not sure yet?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Request a demo on the last step. We&apos;ll reach out within two business days with
                    founder pricing tailored to your facility.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
