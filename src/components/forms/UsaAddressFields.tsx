"use client";

import { Stack, TextField } from "@mui/material";
import type { Control, FieldErrors, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import { UsCityAutocomplete } from "@/components/forms/UsCityAutocomplete";
import { UsStateAutocomplete } from "@/components/forms/UsStateAutocomplete";

type AddressFieldNames = {
  address_line1: string;
  address_line2?: string;
  city: string;
  state_code: string;
  postal_code: string;
  country?: string;
};

export function UsaAddressFields<T extends FieldValues & AddressFieldNames>({
  control,
  errors,
  stateCode,
  disabled,
}: {
  control: Control<T>;
  errors: FieldErrors<T>;
  stateCode: string;
  disabled?: boolean;
}) {
  const err = (key: keyof AddressFieldNames) =>
    errors[key as Path<T>] as { message?: string } | undefined;

  return (
    <Stack spacing={2}>
      <Controller
        name={"address_line1" as Path<T>}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Street address"
            required
            fullWidth
            disabled={disabled}
            error={!!err("address_line1")}
            helperText={err("address_line1")?.message}
          />
        )}
      />
      <Controller
        name={"address_line2" as Path<T>}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Apt, suite, etc. (optional)"
            fullWidth
            disabled={disabled}
            error={!!err("address_line2")}
            helperText={err("address_line2")?.message}
          />
        )}
      />
      <UsStateAutocomplete
        control={control}
        name={"state_code" as Path<T>}
        label="State"
        required
        storeAs="code"
        disabled={disabled}
        error={!!err("state_code")}
        helperText={err("state_code")?.message}
      />
      <UsCityAutocomplete
        control={control}
        name={"city" as Path<T>}
        stateCode={stateCode}
        label="City"
        required
        disabled={disabled}
        error={!!err("city")}
        helperText={err("city")?.message}
      />
      <Controller
        name={"postal_code" as Path<T>}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="ZIP code"
            required
            fullWidth
            disabled={disabled}
            inputProps={{ maxLength: 10 }}
            error={!!err("postal_code")}
            helperText={err("postal_code")?.message}
          />
        )}
      />
    </Stack>
  );
}
