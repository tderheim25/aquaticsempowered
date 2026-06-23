import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Avatar, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { CheckoutSuccessCelebration } from "@/components/billing/CheckoutSuccessCelebration";
import { FOUNDER_DISCOUNT_TERM } from "@/lib/founders/founderProgram";
import { getUsersRowWithAdminFallback } from "@/lib/auth/rbac";
import { loadActiveOrgContext } from "@/lib/auth/activeOrg";
import { createClient } from "@/lib/supabase/server";

import { parsePlanCode } from "@/lib/stripe/prices";
import { syncCheckoutSessionCompleted, syncOrgBillingFromStripe } from "@/lib/stripe/syncSubscription";
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
  if (paidCheckout && isStripeConfigured()) {
    if (sessionId) {
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
        // Webhook or org sync may still update billing.
      }
    } else {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const profile = user ? await getUsersRowWithAdminFallback(user.id) : null;
        const orgCtx = profile ? await loadActiveOrgContext(profile) : null;
        const billingRootId = orgCtx?.billingRootOrgId ?? orgCtx?.activeOrgId;
        if (billingRootId) {
          await syncOrgBillingFromStripe(billingRootId);
        }
      } catch {
        // Modal sync or webhook may still update billing.
      }
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
              {mode !== "paid" ? (
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
              ) : null}

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
                <CheckoutSuccessCelebration
                  planLabel={checkoutPlanLabel}
                  headline="Welcome to the founder program"
                  subline={
                    checkoutPlanLabel
                      ? `Your ${checkoutPlanLabel} founder membership is active with your locked-in 50% subscription rate ${FOUNDER_DISCOUNT_TERM}. We're syncing your workspace — open the dashboard when you're ready.`
                      : `Your founder membership payment succeeded with your locked-in 50% rate ${FOUNDER_DISCOUNT_TERM}. We're syncing your workspace now.`
                  }
                />
              ) : (
                <>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    You&apos;re in — founder account created
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {planLabel ? (
                      <>
                        Your facility is set up on the <strong>{planLabel}</strong> founder plan.
                        {requiresEmailConfirm
                          ? ` Confirm your email, then sign in to complete checkout and lock in your 50% founder rate ${FOUNDER_DISCOUNT_TERM}.`
                          : ` Sign in and complete checkout to lock in your 50% founder rate ${FOUNDER_DISCOUNT_TERM}.`}
                      </>
                    ) : (
                      "Your facility workspace is ready. Sign in to complete founder checkout and lock in 50% off your subscription."
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
