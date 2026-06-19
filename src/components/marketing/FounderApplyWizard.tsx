"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { UsCityAutocomplete } from "@/components/forms/UsCityAutocomplete";
import { UsStateAutocomplete } from "@/components/forms/UsStateAutocomplete";
import { resolveUsState } from "@/lib/geo/resolveUsState";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepConnector,
  StepIconProps,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  stepConnectorClasses,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";

import { submitFounderWizard } from "@/app/(marketing)/founders/_actions";
import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { requestEmbeddedCheckout } from "@/lib/billing/requestEmbeddedCheckout";
import { getPlanDisplayName } from "@/lib/billing/planCatalog";
import { FOUNDER_DISCOUNT_BADGE, FOUNDER_DISCOUNT_TERM } from "@/lib/founders/founderProgram";
import { applyPromoDiscount, promoAppliesToPlan, type SitePromoConfig } from "@/lib/marketing/promo";
import { ANNUAL_BILLING_DISCOUNT } from "@/lib/marketing/publicPricing";
import type { BillingCadence } from "@/lib/stripe/prices";
import {
  choiceStepSchema,
  founderPlanListAmountUsd,
  founderPlanPriceSuffix,
  founderStepSchema,
  FOUNDER_PLAN_CHOICES,
  organizationStepSchema,
  ORG_TIERS,
  ORG_TIER_LABELS,
  type ChoiceStepValues,
  type FounderPlanCode,
  type FounderStepValues,
  type OrganizationStepValues,
} from "@/lib/validations/founderOnboarding";

type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
};

const STEPS: { label: string; helper: string; icon: typeof BusinessRoundedIcon }[] = [
  { label: "Facility", helper: "Tell us about your aquatic operation", icon: BusinessRoundedIcon },
  { label: "Founder", helper: "Who should we talk to?", icon: PersonRoundedIcon },
  { label: "Choose path", helper: "Create an account or request a demo", icon: RocketLaunchRoundedIcon },
];

const WizardConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
    left: "calc(-50% + 22px)",
    right: "calc(50% + 22px)",
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[200],
    borderRadius: 1,
    transition: "background 0.4s ease",
  },
}));

const StepIconRoot = styled("div")<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ theme, ownerState }) => ({
    background: theme.palette.grey[200],
    color: theme.palette.text.secondary,
    width: 44,
    height: 44,
    display: "flex",
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
    ...(ownerState.active && {
      backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      color: theme.palette.common.white,
      transform: "scale(1.05)",
      boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
    }),
    ...(ownerState.completed && {
      backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
      color: theme.palette.common.white,
    }),
  }),
);

function WizardStepIcon(props: StepIconProps) {
  const { active, completed, icon } = props;
  const idx = (icon as number) - 1;
  const Icon = STEPS[idx]?.icon ?? BusinessRoundedIcon;
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? <CheckCircleRoundedIcon /> : <Icon />}
    </StepIconRoot>
  );
}

export function FounderApplyWizard({
  currentUser,
  sitePromo,
  defaultPlanCode = "pro",
}: {
  currentUser: CurrentUser | null;
  sitePromo: SitePromoConfig;
  defaultPlanCode?: FounderPlanCode;
}) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const orgForm = useForm<OrganizationStepValues>({
    resolver: zodResolver(organizationStepSchema),
    mode: "onTouched",
    defaultValues: {
      facility_name: "",
      facility_tier: "municipal",
      website_url: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      region: "",
      postal_code: "",
      country: "United States",
      num_pools: undefined,
    },
  });

  const founderForm = useForm<FounderStepValues>({
    resolver: zodResolver(founderStepSchema),
    mode: "onTouched",
    defaultValues: {
      contact_name: currentUser?.displayName ?? "",
      email: currentUser?.email ?? "",
      phone: "",
      current_pain: "",
      has_session: Boolean(currentUser),
      password: "",
      confirm_password: "",
    },
  });

  const choiceForm = useForm<ChoiceStepValues>({
    resolver: zodResolver(choiceStepSchema),
    mode: "onTouched",
    defaultValues: {
      request_type: "founder_account",
      requested_plan_code: defaultPlanCode,
      billing_cadence: "monthly",
      promo_code: "",
      message: "",
    },
  });

  const choiceValues = choiceForm.watch();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleNext() {
    if (activeStep === 0) {
      const ok = await orgForm.trigger();
      if (!ok) return;
      setActiveStep(1);
      return;
    }
    if (activeStep === 1) {
      const ok = await founderForm.trigger();
      if (!ok) return;
      setActiveStep(2);
      return;
    }
  }

  function handleBack() {
    setSubmitError(null);
    setActiveStep((s) => Math.max(0, s - 1));
  }

  function openCheckoutModal(clientSecret: string) {
    setCheckoutClientSecret(clientSecret);
    setCheckoutModalOpen(true);
  }

  async function startFounderCheckout(choice: ChoiceStepValues) {
    const planCode = choice.requested_plan_code ?? "pro";
    const cadence = choice.billing_cadence ?? "monthly";

    const { response: checkoutRes, data: checkoutData } = await requestEmbeddedCheckout(
      {
        planCode,
        cadence,
        flow: "founder",
        promoCode: choice.promo_code?.trim() || undefined,
      },
      {
        onBeforeRetry: () => {
          router.refresh();
        },
      },
    );

    if (checkoutRes.ok && checkoutData.clientSecret) {
      openCheckoutModal(checkoutData.clientSecret);
      return;
    }

    if (checkoutRes.ok && checkoutData.url) {
      window.location.href = checkoutData.url;
      return;
    }

    if (checkoutRes.status === 503) {
      setSubmitError(
        "Payment is not configured yet. Add Stripe keys to the server environment, or choose Request a demo.",
      );
      return;
    }

    setSubmitError(
      checkoutData.error ??
        "Could not start secure checkout. Verify Stripe price IDs in your environment and try again.",
    );
  }

  const onFinalSubmit: SubmitHandler<ChoiceStepValues> = async (choice) => {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      organization: orgForm.getValues(),
      founder: founderForm.getValues(),
      choice,
    };

    const res = await submitFounderWizard(payload);
    if (!res.ok) {
      setSubmitError(res.error || "Submission failed");
      setSubmitting(false);
      return;
    }

    if (res.mode === "demo") {
      router.push("/founders/thanks?type=demo");
      router.refresh();
      return;
    }

    if (res.requiresEmailConfirm) {
      const params = new URLSearchParams({
        type: "account",
        plan: res.planCode,
        confirm: "1",
      });
      router.push(`/founders/thanks?${params.toString()}`);
      router.refresh();
      return;
    }

    if (res.checkoutClientSecret) {
      openCheckoutModal(res.checkoutClientSecret);
      setSubmitting(false);
      return;
    }

    if (res.checkoutError) {
      setSubmitError(res.checkoutError);
      setSubmitting(false);
      return;
    }

    try {
      await startFounderCheckout(choice);
    } catch {
      setSubmitError("Could not reach the payment service. Check your connection and try again.");
    }

    setSubmitting(false);
  };

  function handleFounderPaymentComplete() {
    const plan = choiceValues.requested_plan_code ?? "pro";
    router.refresh();
    router.push(`/founders/thanks?checkout=success&plan=${plan}`);
  }

  const founderPlanLabel = getPlanDisplayName(choiceValues.requested_plan_code ?? "pro");

  const progress = useMemo(() => ((activeStep + 1) / STEPS.length) * 100, [activeStep]);
  const currentStep = STEPS[activeStep];

  return (
    <Stack spacing={3} sx={{ pb: activeStep === 2 && isMobile ? 10 : 0 }}>
      <Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        />
        {isMobile ? (
          <Stack spacing={1.5} sx={{ pt: 2, pb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: "0.04em" }}>
              Step {activeStep + 1} of {STEPS.length}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isComplete = index < activeStep;
                return (
                  <Box
                    key={step.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 999,
                      border: "1px solid",
                      borderColor: isActive ? "primary.main" : isComplete ? alpha(theme.palette.primary.main, 0.35) : "divider",
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, 0.08)
                        : isComplete
                          ? alpha(theme.palette.primary.main, 0.04)
                          : "transparent",
                      opacity: isActive || isComplete ? 1 : 0.55,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color: isActive || isComplete ? "common.white" : "text.secondary",
                        background: isActive || isComplete
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                          : theme.palette.grey[200],
                      }}
                    >
                      {isComplete ? (
                        <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <Icon sx={{ fontSize: 14 }} />
                      )}
                    </Box>
                    {isActive ? (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", lineHeight: 1.2 }}>
                        {step.label}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
            {currentStep ? (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                {currentStep.helper}
              </Typography>
            ) : null}
          </Stack>
        ) : (
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            connector={<WizardConnector />}
            sx={{ pt: 3, pb: 1 }}
          >
            {STEPS.map((step) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={WizardStepIcon}
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontWeight: 600,
                      color: "text.secondary",
                      "&.Mui-active": { color: "primary.main", fontWeight: 700 },
                      "&.Mui-completed": { color: "primary.main" },
                    },
                  }}
                >
                  <Stack spacing={0.25} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.helper}
                    </Typography>
                  </Stack>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Box>

      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ position: "relative", minHeight: { xs: 0, sm: 360 } }}>
        {!mounted ? (
          <Stack spacing={2.5} aria-hidden>
            <LinearProgress sx={{ borderRadius: 2, opacity: 0.35 }} />
          </Stack>
        ) : activeStep === 0 ? (
          <OrganizationStep form={orgForm} />
        ) : activeStep === 1 ? (
          <FounderStep form={founderForm} currentUser={currentUser} />
        ) : (
          <ChoiceStep
            form={choiceForm}
            sitePromo={sitePromo}
          />
        )}
      </Box>

      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        sx={{
          display: { xs: activeStep === 2 && isMobile ? "none" : "flex", sm: "flex" },
        }}
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={handleBack}
          disabled={activeStep === 0 || submitting}
          variant="text"
          size="large"
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          Back
        </Button>

        {activeStep < STEPS.length - 1 ? (
          <Button
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={handleNext}
            variant="contained"
            size="large"
            sx={{
              minWidth: 200,
              backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            Continue
          </Button>
        ) : checkoutModalOpen ? null : (
          <Button
            onClick={choiceForm.handleSubmit(onFinalSubmit)}
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} sx={{ color: "common.white" }} />
              ) : choiceValues.request_type === "demo" ? (
                <EventAvailableRoundedIcon />
              ) : (
                <RocketLaunchRoundedIcon />
              )
            }
            sx={{
              minWidth: 260,
              backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            {submitting
              ? "Submitting…"
              : choiceValues.request_type === "demo"
                ? "Request demo"
                : "Continue to founder checkout"}
          </Button>
        )}
      </Stack>

      {activeStep === 2 && isMobile && !checkoutModalOpen ? (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            px: 2,
            py: 1.5,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            boxShadow: "0 -8px 24px rgba(15,23,42,0.08)",
          }}
        >
          <Button
            onClick={choiceForm.handleSubmit(onFinalSubmit)}
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} sx={{ color: "common.white" }} />
              ) : choiceValues.request_type === "demo" ? (
                <EventAvailableRoundedIcon />
              ) : (
                <RocketLaunchRoundedIcon />
              )
            }
            sx={{
              backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            {submitting
              ? "Submitting…"
              : choiceValues.request_type === "demo"
                ? "Request demo"
                : "Continue to founder checkout"}
          </Button>
        </Box>
      ) : null}

      <EmbeddedCheckoutModal
        open={checkoutModalOpen && Boolean(checkoutClientSecret)}
        onClose={() => {
          setCheckoutModalOpen(false);
          setCheckoutClientSecret(null);
        }}
        clientSecret={checkoutClientSecret}
        title="Complete founder subscription"
        planLabel={founderPlanLabel}
        onComplete={handleFounderPaymentComplete}
      />
    </Stack>
  );
}

function OrganizationStep({ form }: { form: ReturnType<typeof useForm<OrganizationStepValues>> }) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const region = watch("region");
  const selectedState = resolveUsState(region);

  return (
    <Stack spacing={2.5}>
      <SectionHeader
        eyebrow="Step 1 of 3"
        title="Your facility"
        subtitle="A few details so we can tailor the founder package and onboarding plan to your operation."
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Facility name"
          required
          fullWidth
          {...register("facility_name")}
          error={Boolean(errors.facility_name)}
          helperText={errors.facility_name?.message}
        />
        <FormControl fullWidth error={Boolean(errors.facility_tier)}>
          <InputLabel id="facility-tier-label">Facility type</InputLabel>
          <Controller
            name="facility_tier"
            control={control}
            render={({ field }) => (
              <Select labelId="facility-tier-label" label="Facility type" {...field}>
                {ORG_TIERS.map((t) => (
                  <MenuItem key={t} value={t}>
                    {ORG_TIER_LABELS[t]}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          {errors.facility_tier && (
            <FormHelperText>{errors.facility_tier.message}</FormHelperText>
          )}
        </FormControl>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Website (optional)"
          placeholder="https://yourfacility.com"
          fullWidth
          {...register("website_url")}
          error={Boolean(errors.website_url)}
          helperText={errors.website_url?.message}
        />
        <TextField
          label="Phone (optional)"
          fullWidth
          {...register("phone")}
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message}
        />
      </Stack>

      <Divider flexItem sx={{ my: 0.5, opacity: 0.7 }}>
        <Typography variant="overline" color="text.secondary">
          Location
        </Typography>
      </Divider>

      <TextField
        label="Street address"
        required
        fullWidth
        {...register("address_line1")}
        error={Boolean(errors.address_line1)}
        helperText={errors.address_line1?.message}
      />
      <TextField
        label="Address line 2 (optional)"
        fullWidth
        {...register("address_line2")}
        error={Boolean(errors.address_line2)}
        helperText={errors.address_line2?.message}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <UsCityAutocomplete
            control={control}
            name="city"
            stateCode={selectedState?.code ?? ""}
            label="City"
            required
            error={Boolean(errors.city)}
            helperText={errors.city?.message}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: { sm: 200 } }}>
          <UsStateAutocomplete
            control={control}
            name="region"
            label="State / region"
            required
            error={Boolean(errors.region)}
            helperText={errors.region?.message}
            onStateChange={() => setValue("city", "", { shouldValidate: true })}
          />
        </Box>
        <Box sx={{ flex: { xs: 1, sm: "0 0 148px" }, minWidth: 0 }}>
          <TextField
            label="Postal code"
            required
            fullWidth
            {...register("postal_code")}
            error={Boolean(errors.postal_code)}
            helperText={errors.postal_code?.message}
          />
        </Box>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Country"
          required
          fullWidth
          {...register("country")}
          error={Boolean(errors.country)}
          helperText={errors.country?.message}
        />
        <Controller
          name="num_pools"
          control={control}
          render={({ field }) => (
            <TextField
              label="Bodies of water (optional)"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 999 }}
              value={field.value === undefined || field.value === null ? "" : field.value}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  field.onChange(undefined);
                  return;
                }
                const n = parseInt(v, 10);
                field.onChange(Number.isNaN(n) ? undefined : n);
              }}
              error={Boolean(errors.num_pools)}
              helperText={errors.num_pools?.message}
            />
          )}
        />
      </Stack>
    </Stack>
  );
}

function FounderStep({
  form,
  currentUser,
}: {
  form: ReturnType<typeof useForm<FounderStepValues>>;
  currentUser: CurrentUser | null;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Stack spacing={2.5}>
      <SectionHeader
        eyebrow="Step 2 of 3"
        title="Founder details"
        subtitle={
          currentUser
            ? "We pre-filled this with your account. You can adjust anything below."
            : "We'll use this to set up your founder account. If you only want a demo, we'll still keep this info safely."
        }
      />

      {currentUser && (
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            borderColor: "primary.light",
            background: (t) => alpha(t.palette.primary.main, 0.04),
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <PersonRoundedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {currentUser.displayName || currentUser.email}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Signed in · {currentUser.email}
            </Typography>
          </Box>
          <Chip size="small" color="primary" variant="outlined" label="Using your account" />
        </Paper>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Your name"
          required
          fullWidth
          {...register("contact_name")}
          error={Boolean(errors.contact_name)}
          helperText={errors.contact_name?.message}
        />
        <TextField
          label="Work email"
          type="email"
          required
          fullWidth
          disabled={Boolean(currentUser)}
          {...register("email")}
          error={Boolean(errors.email)}
          helperText={errors.email?.message ?? (currentUser ? "Signed-in email is locked." : undefined)}
        />
      </Stack>

      <TextField
        label="Direct phone (optional)"
        fullWidth
        {...register("phone")}
        error={Boolean(errors.phone)}
        helperText={errors.phone?.message}
      />

      <TextField
        label="What's your biggest operational pain today? (optional)"
        fullWidth
        multiline
        minRows={3}
        {...register("current_pain")}
        error={Boolean(errors.current_pain)}
        helperText={errors.current_pain?.message}
      />

      {!currentUser && (
        <Card variant="outlined" sx={{ borderColor: "divider", borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>
                <LockRoundedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Set a password
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Used if you create your founder account. Minimum 8 characters.
                </Typography>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                autoComplete="new-password"
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message ?? "Min 8 characters"}
              />
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                autoComplete="new-password"
                {...register("confirm_password")}
                error={Boolean(errors.confirm_password)}
                helperText={errors.confirm_password?.message}
              />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

function ChoiceStep({
  form,
  sitePromo,
}: {
  form: ReturnType<typeof useForm<ChoiceStepValues>>;
  sitePromo: SitePromoConfig;
}) {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const requestType = watch("request_type");
  const selectedPlan = watch("requested_plan_code") ?? "pro";
  const billingCadence = watch("billing_cadence") ?? "monthly";
  const anyPromoActive = sitePromo.active;

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Step 3 of 3"
        title="How can we help next?"
        subtitle="Pick the path that fits you. Lock in founder pricing before the first 50 spots are gone."
      />

      <Controller
        name="request_type"
        control={control}
        render={({ field }) => (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <ChoiceCard
              selected={field.value === "founder_account"}
              onClick={() => field.onChange("founder_account")}
              icon={<RocketLaunchRoundedIcon />}
              eyebrow={`Recommended · ${FOUNDER_DISCOUNT_BADGE}`}
              title="Create your founder account"
              description="Set up your workspace, then complete billing below."
              bullets={[
                "Join the first 50 founder facilities at half-price subscription",
                "1 pool included; $29/mo per additional active pool",
                "Concierge onboarding starts after payment",
              ]}
            />
            <ChoiceCard
              selected={field.value === "demo"}
              onClick={() => field.onChange("demo")}
              icon={<EventAvailableRoundedIcon />}
              eyebrow="Need a tour first"
              title="Request a demo"
              description="A founding team member will reach out to walk you through Aquatics Empowered and answer questions."
              bullets={[
                "30-minute personalized walkthrough",
                "Discuss founder pricing in detail",
                "No commitment — we'll bring the suggestions",
              ]}
            />
          </Stack>
        )}
      />

      <Collapse in={requestType === "founder_account"} timeout={250} unmountOnExit>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {anyPromoActive
                ? `You're in — lock in 50% off ${FOUNDER_DISCOUNT_TERM}`
                : "Choose your founder plan"}
            </Typography>
            <Controller
              name="billing_cadence"
              control={control}
              render={({ field }) => (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={field.value ?? "monthly"}
                    onChange={(_, value: BillingCadence | null) => {
                      if (value) field.onChange(value);
                    }}
                    sx={{
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                      borderRadius: 999,
                      p: 0.35,
                      "& .MuiToggleButton-root": {
                        border: "none",
                        borderRadius: 999,
                        px: 2,
                        py: 0.5,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "&:hover": { bgcolor: "primary.dark" },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="monthly">Monthly</ToggleButton>
                    <ToggleButton value="annual">Annual</ToggleButton>
                  </ToggleButtonGroup>
                  {field.value === "annual" ? (
                    <Chip
                      size="small"
                      label={`Save ${Math.round(ANNUAL_BILLING_DISCOUNT * 100)}%`}
                      color="secondary"
                      sx={{ fontWeight: 700, height: 24 }}
                    />
                  ) : null}
                </Stack>
              )}
            />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {FOUNDER_PLAN_CHOICES.map((plan) => (
              <FounderPlanCard
                key={plan.planCode}
                plan={plan}
                selected={selectedPlan === plan.planCode}
                cadence={billingCadence}
                sitePromo={sitePromo}
                onClick={() =>
                  setValue("requested_plan_code", plan.planCode, { shouldValidate: true })
                }
              />
            ))}
          </Stack>

          {!anyPromoActive ? (
            <TextField
              label="Founder promo code (optional)"
              placeholder="AE-XXXX-XXXX"
              fullWidth
              {...register("promo_code")}
              error={Boolean(errors.promo_code)}
              helperText={
                errors.promo_code?.message ??
                "Have a code from our team? Enter it here to lock in founder pricing at checkout."
              }
            />
          ) : null}
        </Stack>
      </Collapse>

      <Collapse in={requestType === "demo"} timeout={250} unmountOnExit>
        <TextField
          label="Anything you want us to know before the call? (optional)"
          multiline
          minRows={3}
          fullWidth
          {...register("message")}
          error={Boolean(errors.message)}
          helperText={errors.message?.message}
        />
      </Collapse>
    </Stack>
  );
}

function FounderPlanCard({
  plan,
  selected,
  cadence,
  sitePromo,
  onClick,
}: {
  plan: (typeof FOUNDER_PLAN_CHOICES)[number];
  selected: boolean;
  cadence: BillingCadence;
  sitePromo: SitePromoConfig;
  onClick: () => void;
}) {
  const theme = useTheme();
  const showPromo = promoAppliesToPlan(plan.planCode, sitePromo);
  const listAmount = founderPlanListAmountUsd(plan.monthlyUsd, cadence);
  const promoAmount = showPromo ? applyPromoDiscount(listAmount, sitePromo) : null;
  const priceSuffix = founderPlanPriceSuffix(cadence);

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        flex: 1,
        position: "relative",
        p: 2.5,
        borderRadius: 3,
        cursor: "pointer",
        outline: "none",
        border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        background: selected
          ? `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.07,
            )} 100%)`
          : theme.palette.background.paper,
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
        "&:focus-visible": {
          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}`,
        },
      }}
    >
      {plan.featured ? (
        <Chip
          size="small"
          icon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
          label="Founder favorite"
          sx={{
            position: "absolute",
            top: -10,
            right: 14,
            fontWeight: 700,
            backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: "common.white",
          }}
        />
      ) : null}
      {showPromo ? (
        <Chip
          size="small"
          label={sitePromo.badge}
          sx={{
            position: "absolute",
            top: -10,
            left: 14,
            fontWeight: 800,
            bgcolor: "secondary.main",
            color: "common.white",
          }}
        />
      ) : null}
      <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.14em" }}>
        {plan.tagline}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
        {plan.name}
      </Typography>
      {showPromo && selected ? (
        <Chip
          size="small"
          label={FOUNDER_DISCOUNT_BADGE}
          sx={{
            mt: 0.75,
            fontWeight: 700,
            bgcolor: alpha(theme.palette.secondary.main, 0.15),
            color: "secondary.dark",
          }}
        />
      ) : null}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, fontWeight: 600 }}>
        {plan.poolLimitLabel}
      </Typography>
      {showPromo && promoAmount != null ? (
        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.5, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.dark" }}>
            ${promoAmount.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {priceSuffix}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, textDecoration: "line-through" }}
          >
            ${listAmount.toLocaleString()} {priceSuffix}
          </Typography>
        </Stack>
      ) : (
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.dark", mt: 0.5 }}>
          ${listAmount.toLocaleString()} {priceSuffix}
        </Typography>
      )}
      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {plan.features.map((feature) => (
          <Stack key={feature} direction="row" spacing={1} alignItems="flex-start">
            <CheckCircleRoundedIcon
              sx={{ color: selected ? "primary.main" : "text.disabled", fontSize: 18, mt: "2px" }}
            />
            <Typography variant="body2" color="text.secondary">
              {feature}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography
        variant="overline"
        sx={{
          color: "secondary.main",
          fontWeight: 700,
          letterSpacing: "0.16em",
          display: { xs: "none", sm: "block" },
        }}
      >
        {eyebrow}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.dark" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 580 }}>
        {subtitle}
      </Typography>
    </Stack>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  eyebrow,
  title,
  description,
  bullets,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        flex: 1,
        cursor: "pointer",
        p: 2.5,
        borderRadius: 3,
        position: "relative",
        outline: "none",
        border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        background: selected
          ? `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.06,
            )} 100%)`
          : theme.palette.background.paper,
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: selected ? theme.palette.primary.main : theme.palette.primary.light,
        },
        "&:focus-visible": {
          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}`,
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          sx={{
            bgcolor: selected ? "primary.main" : alpha(theme.palette.primary.main, 0.08),
            color: selected ? "common.white" : "primary.main",
            width: 44,
            height: 44,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.12em" }}>
            {eyebrow.toUpperCase()}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {description}
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {bullets.map((b) => (
              <Stack key={b} direction="row" spacing={1} alignItems="flex-start">
                <CheckCircleRoundedIcon sx={{ color: selected ? "primary.main" : "text.disabled", fontSize: 18, mt: "2px" }} />
                <Typography variant="body2" color="text.secondary">
                  {b}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        {selected && (
          <IconButton size="small" sx={{ color: "primary.main", pointerEvents: "none" }}>
            <CheckCircleRoundedIcon />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

