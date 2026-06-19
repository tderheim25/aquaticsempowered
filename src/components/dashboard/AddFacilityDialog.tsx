"use client";

import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LandscapeRoundedIcon from "@mui/icons-material/LandscapeRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createFacilityAction } from "@/app/(dashboard)/app/facilities/actions";
import { UsCityAutocomplete } from "@/components/forms/UsCityAutocomplete";
import { UsStateAutocomplete } from "@/components/forms/UsStateAutocomplete";
import { resolveUsState } from "@/lib/geo/resolveUsState";
import { createFacilitySchema, type CreateFacilityValues } from "@/lib/validations/createFacility";
import { ORG_TIER_LABELS, ORG_TIERS } from "@/lib/validations/founderOnboarding";
import { createClient } from "@/lib/supabase/client";
import type { OrgTier } from "@/types/database";

const DEFAULT_VALUES: CreateFacilityValues = {
  facility_name: "",
  facility_tier: "municipal",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "US",
};

const TIER_ICONS: Record<OrgTier, SvgIconComponent> = {
  rural: LandscapeRoundedIcon,
  municipal: AccountBalanceRoundedIcon,
  hotel: HotelRoundedIcon,
  school: SchoolRoundedIcon,
  hospital: LocalHospitalRoundedIcon,
  hoa: ApartmentRoundedIcon,
  splash_pad: WaterDropRoundedIcon,
  wellness: FitnessCenterRoundedIcon,
  commercial: BusinessRoundedIcon,
  therapy: MedicalServicesRoundedIcon,
};

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: SvgIconComponent;
  children: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(0,59,111,0.08)",
          color: "primary.main",
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
        {children}
      </Typography>
    </Stack>
  );
}

function FacilityTypeCard({
  tier,
  selected,
  onSelect,
}: {
  tier: OrgTier;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = TIER_ICONS[tier];
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: 2,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 2,
        p: 1.25,
        bgcolor: selected ? "rgba(0,59,111,0.06)" : "background.paper",
        color: "text.primary",
        transition: "border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease",
        boxShadow: selected ? "0 4px 14px rgba(0,59,111,0.12)" : "none",
        "&:hover": {
          borderColor: selected ? "primary.main" : "primary.light",
          bgcolor: selected ? "rgba(0,59,111,0.08)" : "action.hover",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: selected ? "primary.main" : "rgba(46,165,160,0.12)",
            color: selected ? "primary.contrastText" : "secondary.dark",
            transition: "background-color 200ms ease, color 200ms ease",
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: selected ? 700 : 500, lineHeight: 1.35, pt: 0.25 }}>
          {ORG_TIER_LABELS[tier]}
        </Typography>
      </Stack>
    </Box>
  );
}

export function AddFacilityDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateFacilityValues>({
    resolver: zodResolver(createFacilitySchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const facilityTier = watch("facility_tier");
  const region = watch("region");
  const selectedState = resolveUsState(region);

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setError(null);
    }
  }, [open, reset]);

  const handleClose = () => {
    if (pending) return;
    onClose();
    reset(DEFAULT_VALUES);
    setError(null);
  };

  const onSubmit = handleSubmit((values) => {
    setError(null);
    const formData = new FormData();
    formData.set("facility_name", values.facility_name);
    formData.set("facility_tier", values.facility_tier);
    formData.set("address_line1", values.address_line1);
    formData.set("address_line2", values.address_line2 ?? "");
    formData.set("city", values.city);
    formData.set("region", values.region);
    formData.set("postal_code", values.postal_code);
    formData.set("country", values.country);

    startTransition(async () => {
      const result = await createFacilityAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const supabase = createClient();
      await supabase.auth.refreshSession();
      onClose();
      reset(DEFAULT_VALUES);
      router.push(`/app?org=${result.orgId}`);
      router.refresh();
    });
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(15,23,42,0.14)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          px: 3,
          pt: 2.5,
          pb: 2.5,
          background:
            "linear-gradient(135deg, rgba(0,59,111,0.08) 0%, rgba(46,165,160,0.10) 55%, rgba(255,255,255,0) 100%)",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <IconButton
          aria-label="Close"
          onClick={handleClose}
          disabled={pending}
          size="small"
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ pr: 5 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
              boxShadow: "0 10px 24px rgba(0,59,111,0.22)",
            }}
          >
            <AddBusinessRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Add another facility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.45 }}>
              Register a new site under your account. Pools, logs, and team stay scoped per facility.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
        <Box
          component="form"
          id="add-facility-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
        <Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box>
            <SectionLabel icon={AddBusinessRoundedIcon}>Facility details</SectionLabel>
            <TextField
              label="Facility name"
              placeholder="e.g. Riverside Aquatic Center"
              required
              fullWidth
              size="small"
              margin="none"
              autoFocus
              {...register("facility_name")}
              error={Boolean(errors.facility_name)}
              helperText={errors.facility_name?.message}
            />

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, mb: 1 }}>
              What kind of operation is this?
            </Typography>
            <Grid container spacing={1}>
              {ORG_TIERS.map((tier) => (
                <Grid key={tier} size={{ xs: 6, sm: 4 }}>
                  <FacilityTypeCard
                    tier={tier}
                    selected={facilityTier === tier}
                    onSelect={() => setValue("facility_tier", tier, { shouldValidate: true })}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider flexItem sx={{ opacity: 0.7 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                Location
              </Typography>
            </Stack>
          </Divider>

          <Box>
            <SectionLabel icon={LocationOnOutlinedIcon}>Site address</SectionLabel>
            <Stack spacing={1.5}>
              <TextField
                label="Street address"
                placeholder="123 Main St"
                required
                fullWidth
                size="small"
                margin="none"
                {...register("address_line1")}
                error={Boolean(errors.address_line1)}
                helperText={errors.address_line1?.message}
              />
              <TextField
                label="Suite, building, or unit (optional)"
                fullWidth
                size="small"
                margin="none"
                {...register("address_line2")}
                error={Boolean(errors.address_line2)}
                helperText={errors.address_line2?.message}
              />
              <Grid container spacing={1.5} alignItems="flex-start">
                <Grid size={{ xs: 12, sm: 5 }}>
                  <UsCityAutocomplete
                    control={control}
                    name="city"
                    stateCode={selectedState?.code ?? ""}
                    label="City"
                    required
                    size="small"
                    error={Boolean(errors.city)}
                    helperText={errors.city?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <UsStateAutocomplete
                    control={control}
                    name="region"
                    label="State"
                    required
                    size="small"
                    error={Boolean(errors.region)}
                    helperText={errors.region?.message}
                    onStateChange={() => setValue("city", "", { shouldValidate: true })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="ZIP code"
                    required
                    fullWidth
                    size="small"
                    margin="none"
                    {...register("postal_code")}
                    error={Boolean(errors.postal_code)}
                    helperText={errors.postal_code?.message}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(46,165,160,0.08)",
              border: 1,
              borderColor: "rgba(46,165,160,0.22)",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "secondary.main", mt: 0.15, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              Additional facilities share your subscription and billing. Switch between sites anytime from the
              facility menu in the sidebar.
            </Typography>
          </Box>
        </Stack>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          bgcolor: "rgba(245,247,250,0.65)",
        }}
      >
        <Button onClick={handleClose} disabled={pending} color="inherit" sx={{ minWidth: 96 }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="add-facility-form"
          variant="contained"
          disabled={pending || !isValid}
          startIcon={<AddBusinessRoundedIcon />}
          sx={{
            minWidth: 160,
            boxShadow: "0 8px 20px rgba(0,59,111,0.22)",
            "&:hover": { boxShadow: "0 10px 24px rgba(0,59,111,0.28)" },
          }}
        >
          {pending ? "Creating…" : "Create facility"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
