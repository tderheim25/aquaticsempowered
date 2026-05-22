"use client";

import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo } from "react";
import type { Control, FieldErrors, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import { getUsCitiesForState } from "@/lib/geo/usCities";
import { US_STATES } from "@/lib/geo/usStates";

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
  const cities = useMemo(() => getUsCitiesForState(stateCode), [stateCode]);
  const cityOptions = useMemo(() => cities.map((c) => c.name), [cities]);

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
      <Controller
        name={"state_code" as Path<T>}
        control={control}
        render={({ field }) => (
          <FormControl fullWidth required error={!!err("state_code")} disabled={disabled}>
            <InputLabel id="usa-state-label">State</InputLabel>
            <Select labelId="usa-state-label" label="State" {...field}>
              {US_STATES.map((s) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
            {err("state_code")?.message ? (
              <FormHelperText error>{err("state_code")?.message}</FormHelperText>
            ) : null}
          </FormControl>
        )}
      />
      <Controller
        name={"city" as Path<T>}
        control={control}
        render={({ field }) => (
          <Autocomplete
            options={cityOptions}
            value={field.value || null}
            onChange={(_, v) => field.onChange(v ?? "")}
            onInputChange={(_, v) => field.onChange(v)}
            freeSolo
            disabled={disabled || !stateCode}
            renderInput={(params) => (
              <TextField
                {...params}
                label="City"
                required
                error={!!err("city")}
                helperText={
                  !stateCode
                    ? "Select a state first"
                    : err("city")?.message ?? "Choose from the list or type your city"
                }
              />
            )}
          />
        )}
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
