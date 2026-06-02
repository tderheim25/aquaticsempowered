"use client";

import { Autocomplete, TextField } from "@mui/material";
import { useMemo } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import { getUsCitiesForState } from "@/lib/geo/usCities";

export function UsCityAutocomplete<T extends FieldValues>({
  control,
  name,
  stateCode,
  label = "City",
  required,
  disabled,
  error,
  helperText,
  noStateHelperText = "Select a state first",
}: {
  control: Control<T>;
  name: Path<T>;
  stateCode: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  noStateHelperText?: string;
}) {
  const cityOptions = useMemo(
    () => getUsCitiesForState(stateCode).map((c) => c.name),
    [stateCode],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          fullWidth
          freeSolo
          options={cityOptions}
          value={field.value || null}
          slotProps={{
            popper: {
              sx: { minWidth: 280 },
            },
          }}
          onChange={(_, value) => field.onChange(typeof value === "string" ? value : (value ?? ""))}
          onInputChange={(_, value) => field.onChange(value)}
          disabled={disabled || !stateCode}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              required={required}
              fullWidth
              error={error}
              helperText={
                !stateCode ? noStateHelperText : helperText ?? "Choose from the list or type your city"
              }
            />
          )}
        />
      )}
    />
  );
}
