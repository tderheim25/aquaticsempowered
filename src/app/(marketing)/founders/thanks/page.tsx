import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Avatar, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { parsePlanCode } from "@/lib/stripe/prices";
import { syncCheckoutSessionCompleted } from "@/lib/stripe/syncSubscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export const metadata = {
  title: "Thank you | Aquatics Empowered",
};

type SearchParams = {
  type?: string;
  plan?: string;
  confirm?: string;
  checkout?: string;
  session_id?: string;
};

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
  const { type, plan, confirm, checkout, session_id: sessionId } = (await searchParams) ?? {};
  const paidCheckout = checkout === "success";
  const mode = type === "demo" ? "demo" : paidCheckout ? "paid" : "account";
  const planLabel = plan ? PLAN_LABELS[plan] ?? plan : null;
  const requiresEmailConfirm = confirm === "1";

  let checkoutPlanLabel: string | null = planLabel;
  if (paidCheckout && sessionId && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await syncCheckoutSessionCompleted(session);
      }
      const planCode = parsePlanCode(session.metadata?.plan_code ?? null);
      if (planCode) {
        checkoutPlanLabel = PLAN_LABELS[planCode] ?? planCode;
      }
    } catch {
      // Webhook may still sync; generic copy is fine if retrieve/sync fails.
    }
  }

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
                ) : mode === "paid" ? (
                  <PaymentRoundedIcon sx={{ fontSize: 36 }} />
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
              ) : mode === "paid" ? (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    Founder payment confirmed
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {checkoutPlanLabel ? (
                      <>
                        Your founder membership on the <strong>{checkoutPlanLabel}</strong> plan is
                        active. We&apos;re syncing your workspace — you can open the dashboard now.
                      </>
                    ) : (
                      "Your founder membership payment succeeded. We're syncing your workspace now."
                    )}
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
                        {requiresEmailConfirm
                          ? " Confirm your email, then sign in to complete annual payment on Stripe Checkout."
                          : " Sign in and return to the founder flow if you still need to complete payment."}
                      </>
                    ) : (
                      "Your facility workspace is ready. Sign in to complete founder checkout when you're ready."
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
                          Confirm your email, then complete payment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          We sent a confirmation link. After verifying, sign in and finish checkout from
                          the founder page or pricing — your plan is saved to your organization.
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
                ) : mode === "paid" ? (
                  <Button component={Link} href="/app" variant="contained" color="primary" size="large">
                    Open dashboard
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
