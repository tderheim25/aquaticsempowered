"use client";

import { Autocomplete, TextField } from "@mui/material";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

import { resolveUsState } from "@/lib/geo/resolveUsState";
import { US_STATES } from "@/lib/geo/usStates";

export function UsStateAutocomplete<T extends FieldValues>({
  control,
  name,
  label = "State",
  required,
  disabled,
  error,
  helperText,
  storeAs = "name",
  onStateChange,
  size = "medium",
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** Persist the 2-letter code (e.g. CA) or full state name. */
  storeAs?: "code" | "name";
  onStateChange?: (storedValue: string) => void;
  size?: "small" | "medium";
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected = resolveUsState(field.value);
        return (
          <Autocomplete
            fullWidth
            options={[...US_STATES]}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            value={selected}
            slotProps={{
              popper: {
                sx: { minWidth: 280 },
              },
            }}
            onChange={(_, newValue) => {
              const next = newValue
                ? storeAs === "code"
                  ? newValue.code
                  : newValue.name
                : "";
              field.onChange(next);
              onStateChange?.(next);
            }}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                required={required}
                fullWidth
                size={size}
                margin="none"
                error={error}
                helperText={helperText}
              />
            )}
          />
        );
      }}
    />
  );
}
