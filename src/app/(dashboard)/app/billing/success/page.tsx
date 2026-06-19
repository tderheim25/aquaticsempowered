import { Button, Card, CardContent, Container, Stack } from "@mui/material";
import Link from "next/link";

import { CheckoutSuccessCelebration } from "@/components/billing/CheckoutSuccessCelebration";
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

type SearchParams = { session_id?: string; plan?: string };

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireProfileForApp();
  const { session_id: sessionId, plan: planParam } = (await searchParams) ?? {};

  let planLabel: string | null = planParam ? PLAN_LABELS[planParam] ?? planParam : null;
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
            <CheckoutSuccessCelebration
              planLabel={planLabel}
              headline={paymentConfirmed ? "Payment confirmed" : "Thanks for subscribing"}
              subline={
                planLabel
                  ? `Your organization is being upgraded to the ${planLabel} plan. Feature access updates within a minute once billing sync completes.`
                  : "Your subscription is being activated. Feature access updates within a minute once billing sync completes."
              }
            />

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