"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { getPlanDisplayName } from "@/lib/billing/planCatalog";
import { requestEmbeddedCheckout } from "@/lib/billing/requestEmbeddedCheckout";
import type { FounderProgramBlocked } from "@/lib/founders/founderProgramGate";
import type { PlanCode } from "@/types/database";

function resolveFounderCheckoutPlan(planCode: PlanCode | null): "essential" | "pro" {
  return planCode === "essential" ? "essential" : "pro";
}

export function FounderProgramStatusCard({ status }: { status: FounderProgramBlocked }) {
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const checkoutPlan = resolveFounderCheckoutPlan(status.planCode);
  const planLabel = getPlanDisplayName(checkoutPlan);

  async function handleCompletePayment() {
    setLoadingCheckout(true);
    setCheckoutError(null);

    try {
      const { response, data } = await requestEmbeddedCheckout(
        {
          planCode: checkoutPlan,
          cadence: "monthly",
          flow: "founder",
        },
        {
          onBeforeRetry: () => {
            router.refresh();
          },
        },
      );

      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCheckoutOpen(true);
        return;
      }

      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/founders")}`;
        return;
      }

      setCheckoutError(
        data.error ?? "Could not start checkout. Try again or open Subscription from your dashboard.",
      );
    } catch {
      setCheckoutError("Could not reach the payment service. Check your connection and try again.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  const primaryHref = status.awaitingPayment && status.completePaymentHref
    ? status.completePaymentHref
    : status.dashboardHref;
  const primaryLabel = status.awaitingPayment ? "Complete payment" : "Go to Dashboard";

  return (
    <Stack spacing={3} sx={{ py: { xs: 1, sm: 2 } }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: status.awaitingPayment ? "warning.main" : "success.main",
            color: status.awaitingPayment ? "warning.contrastText" : "success.contrastText",
            boxShadow: status.awaitingPayment
              ? "0 8px 20px rgba(237, 108, 2, 0.25)"
              : "0 8px 20px rgba(46,165,160,0.35)",
          }}
        >
          <CheckCircleRoundedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {status.title}
          </Typography>
          {status.orgName ? (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {status.orgName}
            </Typography>
          ) : null}
          {status.subscriptionLine ? (
            <Chip
              label={status.subscriptionLine}
              size="small"
              color={status.awaitingPayment ? "warning" : "success"}
              variant="outlined"
              sx={{ mb: 1.5, fontWeight: 600 }}
            />
          ) : null}
          <Typography variant="body1" color="text.secondary">
            {status.message}
          </Typography>
        </Box>
      </Stack>

      {checkoutError ? (
        <Alert severity="error" onClose={() => setCheckoutError(null)}>
          {checkoutError}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {status.awaitingPayment ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => void handleCompletePayment()}
            disabled={loadingCheckout}
            startIcon={loadingCheckout ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {loadingCheckout ? "Starting checkout…" : primaryLabel}
          </Button>
        ) : (
          <Button component={Link} href={primaryHref} variant="contained" size="large">
            {primaryLabel}
          </Button>
        )}
        {status.billingHref && !status.awaitingPayment ? (
          <Button component={Link} href={status.billingHref} variant="outlined" size="large">
            Manage subscription
          </Button>
        ) : null}
        {status.awaitingPayment && status.dashboardHref ? (
          <Button component={Link} href={status.dashboardHref} variant="outlined" size="large">
            Go to Dashboard
          </Button>
        ) : null}
      </Stack>

      <EmbeddedCheckoutModal
        open={checkoutOpen && Boolean(clientSecret)}
        onClose={() => {
          setCheckoutOpen(false);
          setClientSecret(null);
        }}
        clientSecret={clientSecret}
        title="Complete founder subscription"
        planLabel={planLabel}
        onComplete={() => {
          setCheckoutOpen(false);
          setClientSecret(null);
          router.push(`/founders/thanks?checkout=success&plan=${checkoutPlan}`);
          router.refresh();
        }}
      />
    </Stack>
  );
}
