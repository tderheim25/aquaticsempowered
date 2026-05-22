import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Avatar, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const metadata = {
  title: "Thank you | Aquatics Empowered",
};

type SearchParams = { type?: string; plan?: string; confirm?: string };

const PLAN_LABELS: Record<string, string> = {
  essential: "Essential",
  pro: "Professional",
  enterprise: "Enterprise",
};

export default async function FoundersThanksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { type, plan, confirm } = (await searchParams) ?? {};
  const mode = type === "demo" ? "demo" : "account";
  const planLabel = plan ? PLAN_LABELS[plan] ?? plan : null;
  const requiresEmailConfirm = confirm === "1";

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(0,59,111,0.06) 0%, rgba(46,165,160,0.05) 40%, rgba(245,247,250,1) 80%)",
      }}
    >
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <Card sx={{ borderRadius: 4, boxShadow: "0 24px 60px rgba(15,23,42,0.08)" }}>
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Stack spacing={2.5} alignItems="center">
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
                  boxShadow: "0 18px 36px rgba(0,59,111,0.25)",
                }}
              >
                {mode === "demo" ? (
                  <EventAvailableRoundedIcon sx={{ fontSize: 36 }} />
                ) : (
                  <RocketLaunchRoundedIcon sx={{ fontSize: 36 }} />
                )}
              </Avatar>

              {mode === "demo" ? (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    Demo request received
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    A member of our founding team will reach out within two business days to schedule
                    your personalized walkthrough and discuss founder pricing.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    Your founder account is live
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {planLabel ? (
                      <>
                        Your facility is set up on the <strong>{planLabel}</strong> founder plan.
                        We&apos;ll follow up with founder pricing and billing — no payment required to
                        start.
                      </>
                    ) : (
                      "Your facility workspace is ready and the founder onboarding team has been notified."
                    )}
                  </Typography>
                  {requiresEmailConfirm && (
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{
                        borderRadius: 2,
                        backgroundColor: "rgba(46,165,160,0.10)",
                        p: 2,
                        textAlign: "left",
                      }}
                    >
                      <CheckCircleRoundedIcon sx={{ color: "secondary.main", mt: "2px" }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          One quick step — confirm your email
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          We sent a confirmation link to verify your address. After confirming you can
                          sign in to your founder workspace.
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ pt: 1 }}>
                <Button component={Link} href="/" variant="outlined" color="primary" size="large">
                  Back to home
                </Button>
                {mode === "account" ? (
                  <Button
                    component={Link}
                    href={requiresEmailConfirm ? "/check-email" : "/app"}
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    {requiresEmailConfirm ? "Check your inbox" : "Open dashboard"}
                  </Button>
                ) : (
                  <Button component={Link} href="/pricing" variant="contained" color="primary" size="large">
                    Explore pricing
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
