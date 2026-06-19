"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { PoolLicenseManager } from "@/components/billing/PoolLicenseManager";
import { requestEmbeddedCheckout } from "@/lib/billing/requestEmbeddedCheckout";
import { POOL_ADDON_MONTHLY_USD } from "@/lib/marketing/publicPricing";
import { formatUsd } from "@/lib/marketing/publicPricing";
import { FOUNDER_DISCOUNT_BADGE } from "@/lib/founders/founderProgram";
import type { OrgSubscriptionDetails } from "@/lib/billing/loadOrgSubscriptionDetails";
import type { PoolLicenseSnapshot } from "@/lib/billing/poolLicenseTypes";
import {
  getPlanDisplayName,
  founderPriceLabel,
  planChangeLabel,
  priceLabel,
  SELF_SERVE_PLANS,
  type SelfServePlanOption,
} from "@/lib/billing/planCatalog";
import type { SelfServeBillingAvailability } from "@/lib/billing/stripeBillingAvailability";
import type { BillingCadence } from "@/lib/stripe/prices";
import type { PlanCode } from "@/types/database";

type ApiErrorBody = { error?: string; code?: string; url?: string; clientSecret?: string };

async function readApiJson(res: Response): Promise<ApiErrorBody> {
  try {
    return (await res.json()) as ApiErrorBody;
  } catch {
    return { error: res.statusText || "Unexpected server response" };
  }
}

export function SubscriptionPageContent({
  details,
  billingAvailability,
  poolLicenseSnapshot = null,
  autoOpenCheckout = false,
}: {
  details: OrgSubscriptionDetails;
  billingAvailability: SelfServeBillingAvailability;
  poolLicenseSnapshot?: PoolLicenseSnapshot | null;
  autoOpenCheckout?: boolean;
}) {
  const router = useRouter();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const billingSummary = details.billingSummary;
  const isFounder = details.isFounder || Boolean(billingSummary?.isFounder);
  const founderDiscountEndsFormatted =
    billingSummary?.founderDiscountEndsFormatted ?? details.founderDiscountEndsFormatted;
  const [cadence, setCadence] = useState<BillingCadence>(billingSummary?.cadence ?? "monthly");
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<PlanCode | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [autoOpeningCheckout, setAutoOpeningCheckout] = useState(false);

  const { summary } = details;
  const currentPlan = summary.planCode;
  const awaitingPayment =
    summary.status === "incomplete" ||
    summary.status === "founder_pending" ||
    summary.status === "incomplete_expired";

  useEffect(() => {
    if (billingSummary?.cadence) {
      setCadence(billingSummary.cadence);
    }
  }, [billingSummary?.cadence]);

  useEffect(() => {
    if (error || success) {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error, success]);

  useEffect(() => {
    if (!autoOpenCheckout || !awaitingPayment || !billingAvailability.stripeConfigured) return;
    const planToCheckout =
      currentPlan === "essential" || currentPlan === "pro" ? currentPlan : "essential";
    setAutoOpeningCheckout(true);
    void startCheckout(planToCheckout).finally(() => setAutoOpeningCheckout(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCheckout]);

  async function openCheckoutModal(planCode: PlanCode, clientSecret: string) {
    setCheckoutClientSecret(clientSecret);
    setCheckoutPlanCode(planCode);
    setCheckoutModalOpen(true);
  }

  function isPriceConfigured(planCode: PlanCode): boolean {
    if (planCode === "essential") return billingAvailability.essential[cadence];
    if (planCode === "pro") return billingAvailability.pro[cadence];
    return false;
  }

  async function startCheckout(planCode: PlanCode): Promise<boolean> {
    if (!billingAvailability.stripeConfigured) {
      setError("Stripe is not configured on this server. Add STRIPE_SECRET_KEY to enable checkout.");
      return false;
    }
    if (!isPriceConfigured(planCode)) {
      setError(
        `Stripe price IDs are missing for ${planCode} (${cadence}). Add STRIPE_PRICE_${planCode.toUpperCase()}_${cadence.toUpperCase()} to your environment.`,
      );
      return false;
    }

    const founderFlow = details.poolBilling?.founder ?? false;
    const checkoutPlan =
      planCode === "essential" || planCode === "pro" || planCode === "enterprise"
        ? planCode
        : "essential";

    const { response: res, data } = await requestEmbeddedCheckout(
      {
        planCode: checkoutPlan,
        cadence: founderFlow ? "monthly" : cadence,
        flow: founderFlow ? "founder" : "self_serve",
      },
      {
        onBeforeRetry: () => {
          router.refresh();
        },
      },
    );
    if (res.ok && data.clientSecret) {
      await openCheckoutModal(planCode, data.clientSecret);
      return true;
    }
    if (res.ok && data.url) {
      window.location.assign(data.url);
      return true;
    }
    setError(data.error ?? "Could not start checkout.");
    return false;
  }

  async function changePlan(planCode: PlanCode): Promise<"ok" | "checkout" | "failed"> {
    const res = await fetch("/api/stripe/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode, cadence }),
    });
    const data = await readApiJson(res);
    if (res.ok) {
      return "ok";
    }
    if (data.code === "checkout_required") {
      return "checkout";
    }
    setError(data.error ?? "Could not change plan.");
    return "failed";
  }

  async function onSelectPlan(plan: SelfServePlanOption) {
    const change = planChangeLabel(currentPlan, plan.planCode);
    if (change === "current") return;

    setLoadingPlan(plan.planCode);
    setError(null);
    setSuccess(null);

    try {
      if (details.canChangePlan) {
        const result = await changePlan(plan.planCode);
        if (result === "ok") {
          setSuccess(`Your plan is now ${plan.name}. Changes may take a moment to appear everywhere.`);
          router.refresh();
          return;
        }
        if (result === "checkout") {
          await startCheckout(plan.planCode);
          return;
        }
        return;
      }

      await startCheckout(plan.planCode);
    } catch {
      setError("Could not reach the billing service. Check your connection and try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  function actionLabel(plan: SelfServePlanOption): string {
    const change = planChangeLabel(currentPlan, plan.planCode);
    if (change === "current") return "Current plan";
    if (change === "upgrade") return "Upgrade";
    if (change === "downgrade") return "Downgrade";
    return details.canChangePlan ? "Switch plan" : "Subscribe";
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 960, mx: "auto" }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
          Subscription
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {details.orgName
            ? `Billing for ${details.orgName}`
            : "Manage your organization plan and billing."}
        </Typography>
      </Box>

      <Box ref={feedbackRef}>
        {!billingAvailability.stripeConfigured ? (
          <Alert severity="warning" sx={{ mb: error || success ? 2 : 0 }}>
            Billing is not configured in this environment (missing STRIPE_SECRET_KEY). Upgrade buttons
            will not work until Stripe is connected.
          </Alert>
        ) : null}
        {error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mt: error ? 2 : 0 }}>
            {success}
          </Alert>
        ) : null}
      </Box>

      {awaitingPayment ? (
        <Alert
          severity="warning"
          action={
            billingAvailability.stripeConfigured ? (
              <Button
                color="inherit"
                size="small"
                disabled={autoOpeningCheckout}
                onClick={() => {
                  const plan =
                    currentPlan === "essential" || currentPlan === "pro" ? currentPlan : "essential";
                  void startCheckout(plan);
                }}
              >
                {autoOpeningCheckout ? "Opening…" : "Complete payment"}
              </Button>
            ) : undefined
          }
        >
          Your plan is not active yet. Complete secure checkout to unlock full access.
        </Alert>
      ) : null}

      <EmbeddedCheckoutModal
        open={checkoutModalOpen && Boolean(checkoutClientSecret)}
        onClose={() => {
          setCheckoutModalOpen(false);
          setCheckoutClientSecret(null);
          setCheckoutPlanCode(null);
        }}
        clientSecret={checkoutClientSecret}
        title={
          checkoutPlanCode
            ? `Subscribe to ${getPlanDisplayName(checkoutPlanCode) ?? checkoutPlanCode}`
            : "Complete subscription"
        }
        planLabel={getPlanDisplayName(checkoutPlanCode)}
        onComplete={() => {
          const plan = checkoutPlanCode ?? currentPlan;
          setCheckoutModalOpen(false);
          setCheckoutClientSecret(null);
          setCheckoutPlanCode(null);
          router.refresh();
          router.push(`/app/billing/success?plan=${plan}`);
        }}
      />

      {details.hasStripeSubscription && poolLicenseSnapshot ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Pool add-ons
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <PoolLicenseManager
                initialSnapshot={poolLicenseSnapshot}
                canPurchase={details.canPurchasePoolAddons}
                purchaseBlockedReason={details.poolAddonPurchaseBlockedReason}
              />
            </Box>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                Current plan
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {summary.planLabel}
                </Typography>
                <Chip
                  label={summary.statusLabel}
                  size="small"
                  color={summary.statusColor}
                  variant="outlined"
                />
                {billingSummary ? (
                  <Chip
                    label={billingSummary.cadence === "annual" ? "Annual" : "Monthly"}
                    size="small"
                    variant="outlined"
                  />
                ) : null}
                {isFounder ? (
                  <Chip label="Founder" size="small" color="success" variant="outlined" />
                ) : null}
              </Stack>
              {details.validUntilLine ? (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                  {details.validUntilLine}
                </Typography>
              ) : summary.periodLine ? (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                  {summary.periodLine}
                </Typography>
              ) : null}
              {isFounder ? (
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  {billingSummary?.cadence === "annual" && billingSummary.periodPaidUsd != null ? (
                    <Typography variant="body2" color="text.secondary">
                      Paid ${formatUsd(billingSummary.periodPaidUsd)} for this year
                      {billingSummary.discountLabel ? ` (${billingSummary.discountLabel})` : ""}
                    </Typography>
                  ) : null}
                  {(() => {
                    const founderMonthly =
                      billingSummary?.founderMonthlyBaseUsd ?? details.poolBilling?.baseUsd ?? null;
                    if (founderMonthly == null) return null;
                    return (
                      <Typography variant="body2" color="text.secondary">
                        {billingSummary?.cadence === "annual"
                          ? `Founder base rate: $${formatUsd(founderMonthly)}/mo · pool add-ons $${POOL_ADDON_MONTHLY_USD}/mo each (not discounted)`
                          : `$${formatUsd(founderMonthly)}/mo founder base rate (${FOUNDER_DISCOUNT_BADGE}) · pool add-ons $${POOL_ADDON_MONTHLY_USD}/mo each`}
                      </Typography>
                    );
                  })()}
                  {founderDiscountEndsFormatted ? (
                    <Typography variant="body2" color="text.secondary">
                      Founder pricing through {founderDiscountEndsFormatted}
                    </Typography>
                  ) : null}
                </Stack>
              ) : billingSummary?.cadence === "annual" && billingSummary.periodPaidUsd != null ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Paid ${formatUsd(billingSummary.periodPaidUsd)} for this billing year
                </Typography>
              ) : null}
              {details.periodStartFormatted && details.periodEndFormatted ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Billing period: {details.periodStartFormatted} – {details.periodEndFormatted}
                </Typography>
              ) : null}
            </Box>
            {summary.canManageBilling ? (
              <ManageBillingButton />
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      {details.poolBilling && details.poolBilling.activePoolCount > 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Estimated monthly total
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Base subscription
                  {details.poolBilling.founder ? " (founder rate)" : ""}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${details.poolBilling.baseUsd}/mo
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Pool add-ons ({details.poolBilling.addonQuantity} × ${POOL_ADDON_MONTHLY_USD})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${details.poolBilling.poolFeesUsd}/mo
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ pt: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.dark" }}>
                  ${details.poolBilling.totalUsd}/mo
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {details.poolBilling.activePoolCount} active pool
                {details.poolBilling.activePoolCount === 1 ? "" : "s"} across all facilities on your account —
                first included, additional billed at ${POOL_ADDON_MONTHLY_USD}/mo each. Founder discount applies
                to the base subscription only.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Change plan
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={cadence}
          onChange={(_, value: BillingCadence | null) => {
            if (value) setCadence(value);
          }}
        >
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="annual">Annual</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2}>
        {SELF_SERVE_PLANS.map((plan) => {
          const change = planChangeLabel(currentPlan, plan.planCode);
          const isCurrent = change === "current";
          const loading = loadingPlan === plan.planCode;
          const priceReady = isPriceConfigured(plan.planCode);

          return (
            <Grid key={plan.planCode} size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? "primary.main" : "divider",
                }}
              >
                <CardContent sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700 }}>
                          {plan.tagline}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {plan.name}
                        </Typography>
                      </Box>
                      {isCurrent ? (
                        <Chip size="small" color="primary" label="Current" icon={<CheckCircleRoundedIcon />} />
                      ) : null}
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.dark" }}>
                        {isFounder ? founderPriceLabel(plan, cadence) : priceLabel(plan, cadence)}
                      </Typography>
                      {isFounder ? (
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textDecoration: "line-through" }}
                          >
                            {priceLabel(plan, cadence)} list
                          </Typography>
                          <Chip size="small" color="success" variant="outlined" label={FOUNDER_DISCOUNT_BADGE} />
                        </Stack>
                      ) : null}
                    </Stack>
                    <Stack spacing={0.5} sx={{ pt: 1 }}>
                      {plan.highlights.map((h) => (
                        <Typography key={h} variant="body2" color="text.secondary">
                          · {h}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                  <Button
                    type="button"
                    variant={isCurrent ? "outlined" : "contained"}
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={
                      isCurrent ||
                      loading ||
                      !billingAvailability.stripeConfigured ||
                      !priceReady
                    }
                    onClick={() => void onSelectPlan(plan)}
                  >
                    {loading ? <CircularProgress size={22} color="inherit" /> : actionLabel(plan)}
                  </Button>
                  {!priceReady && billingAvailability.stripeConfigured ? (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: "block" }}>
                      Stripe price not configured for {cadence} billing.
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "action.hover" }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Enterprise
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Municipal networks and multi-site operators — custom pricing and onboarding.
          </Typography>
          <Button component={Link} href="/founders" variant="outlined">
            Talk to our team
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
