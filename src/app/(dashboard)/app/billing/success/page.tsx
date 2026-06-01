import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Avatar, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { parsePlanCode } from "@/lib/stripe/prices";
import { syncCheckoutSessionCompleted } from "@/lib/stripe/syncSubscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export const metadata = {
  title: "Subscription confirmed | Aquatics Empowered",
};

const PLAN_LABELS: Record<string, string> = {
  essential: "Essential",
  pro: "Professional",
  enterprise: "Enterprise",
};

type SearchParams = { session_id?: string };

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfileForApp();
  const { session_id: sessionId } = (await searchParams) ?? {};

  let planLabel: string | null = null;
  let paymentConfirmed = false;

  if (sessionId && isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentConfirmed = session.payment_status === "paid";
      if (paymentConfirmed) {
        await syncCheckoutSessionCompleted(session);
      }
      const planCode = parsePlanCode(session.metadata?.plan_code ?? null);
      if (planCode) {
        planLabel = PLAN_LABELS[planCode] ?? planCode;
      }
    } catch {
      // Webhook may still sync; show generic success if session lookup fails.
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card sx={{ borderRadius: 4, boxShadow: "0 24px 60px rgba(15,23,42,0.08)" }}>
        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center">
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
                boxShadow: "0 18px 36px rgba(0,59,111,0.25)",
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 36 }} />
            </Avatar>

            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {paymentConfirmed ? "Payment confirmed" : "Thanks for subscribing"}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {planLabel ? (
                <>
                  Your organization is being upgraded to the <strong>{planLabel}</strong> plan.
                  Feature access updates within a minute once billing sync completes.
                </>
              ) : (
                "Your subscription is being activated. Feature access updates within a minute once billing sync completes."
              )}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
              <Button component={Link} href="/app" variant="contained" color="primary" size="large">
                Open dashboard
              </Button>
              <ManageBillingButton />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}