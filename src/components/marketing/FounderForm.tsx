"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { submitFounderLead } from "@/app/(marketing)/founders/_actions";
import { founderSchema, type FounderFormValues, ORG_TIERS } from "@/lib/validations/founder";
import type { OrgTier } from "@/types/database";

const tierLabels: Record<OrgTier, string> = {
  rural: "Rural community pool",
  municipal: "Municipal / city pool",
  hotel: "Hotel / resort",
  school: "School / university",
  hospital: "Hospital / healthcare",
  hoa: "HOA / residential",
  splash_pad: "Splash pad",
  wellness: "Wellness / fitness",
  commercial: "Commercial aquatic",
  therapy: "Therapy / medical pool",
};

export function FounderForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FounderFormValues>({
    resolver: zodResolver(founderSchema),
    defaultValues: {
      facility_name: "",
      facility_tier: "municipal",
      contact_name: "",
      email: "",
      phone: "",
      num_pools: undefined,
      current_pain: "",
    },
  });

  async function onSubmit(data: FounderFormValues) {
    setFormError(null);
    const res = await submitFounderLead(data);
    if (res.ok) {
      router.push("/founders/thanks");
    } else {
      setFormError("error" in res ? res.error : "Submission failed");
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
      {formError && <Alert severity="error">{formError}</Alert>}
      <TextField
        label="Facility name"
        {...register("facility_name")}
        error={Boolean(errors.facility_name)}
        helperText={errors.facility_name?.message}
        required
        fullWidth
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
                  {tierLabels[t]}
                </MenuItem>
              ))}
            </Select>
          )}
        />
        {errors.facility_tier && (
          <Typography variant="caption" color="error">
            {errors.facility_tier.message}
          </Typography>
        )}
      </FormControl>
      <TextField
        label="Your name"
        {...register("contact_name")}
        error={Boolean(errors.contact_name)}
        helperText={errors.contact_name?.message}
        required
        fullWidth
      />
      <TextField
        label="Work email"
        type="email"
        {...register("email")}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        required
        fullWidth
      />
      <TextField
        label="Phone (optional)"
        {...register("phone")}
        error={Boolean(errors.phone)}
        helperText={errors.phone?.message}
        fullWidth
      />
      <Controller
        name="num_pools"
        control={control}
        render={({ field }) => (
          <TextField
            label="Number of bodies of water (optional)"
            type="number"
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
            fullWidth
          />
        )}
      />
      <TextField
        label="What’s your biggest operational pain today? (optional)"
        {...register("current_pain")}
        error={Boolean(errors.current_pain)}
        helperText={errors.current_pain?.message}
        fullWidth
        multiline
        minRows={3}
      />
      <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Request founder access"}
      </Button>
    </Stack>
  );
}
