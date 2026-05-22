"use client";

import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PoolOutlinedIcon from "@mui/icons-material/PoolOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { POOL_STATUSES, POOL_TYPES, type PoolFormValues } from "@/lib/validations/pools";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "text.secondary",
        fontSize: 11,
        lineHeight: 1,
      }}
    >
      {children}
    </Typography>
  );
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "rgba(248, 250, 252, 0.6)",
    transition: "background-color 150ms ease, box-shadow 150ms ease",
    "& fieldset": {
      borderColor: "rgba(15, 35, 54, 0.12)",
    },
    "&:hover": {
      bgcolor: "rgba(248, 250, 252, 1)",
      "& fieldset": {
        borderColor: "rgba(15, 35, 54, 0.24)",
      },
    },
    "&.Mui-focused": {
      bgcolor: "background.paper",
      boxShadow: "0 0 0 4px rgba(0, 59, 111, 0.08)",
      "& fieldset": {
        borderWidth: 1,
        borderColor: "primary.main",
      },
    },
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    color: "text.secondary",
    fontSize: 18,
  },
  "& .MuiInputBase-input::placeholder": {
    color: "text.secondary",
    opacity: 0.7,
  },
} as const;

const sharedTextFieldProps = {
  fullWidth: true,
  size: "small" as const,
  margin: "none" as const,
  sx: fieldSx,
};

export function PoolFormFields({
  defaults,
  poolId,
  orgIdField,
}: {
  defaults: PoolFormValues;
  poolId?: string;
  orgIdField?: ReactNode;
}) {
  return (
    <Stack spacing={3}>
      {poolId ? <input type="hidden" name="id" value={poolId} /> : null}
      {orgIdField}

      <Stack spacing={1.5}>
        <SectionLabel>Identity</SectionLabel>
        <TextField
          {...sharedTextFieldProps}
          name="name"
          label="Pool name"
          required
          defaultValue={defaults.name}
          placeholder="Main lap pool"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PoolOutlinedIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          {...sharedTextFieldProps}
          name="location_label"
          label="Location"
          defaultValue={defaults.location_label ?? ""}
          placeholder="Indoor — Building A"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PlaceOutlinedIcon />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack spacing={1.5}>
        <SectionLabel>Specifications</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <TextField
            {...sharedTextFieldProps}
            name="pool_type"
            label="Sanitizer system"
            select
            defaultValue={defaults.pool_type}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScienceOutlinedIcon />
                </InputAdornment>
              ),
            }}
          >
            {POOL_TYPES.map((t) => (
              <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            {...sharedTextFieldProps}
            name="status"
            label="Status"
            select
            defaultValue={defaults.status}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ToggleOnOutlinedIcon />
                </InputAdornment>
              ),
            }}
          >
            {POOL_STATUSES.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          {...sharedTextFieldProps}
          name="volume_gallons"
          label="Volume"
          type="number"
          defaultValue={defaults.volume_gallons ?? ""}
          placeholder="e.g. 25000"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <StraightenOutlinedIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  gallons
                </Typography>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack spacing={1.5}>
        <SectionLabel>Notes</SectionLabel>
        <TextField
          {...sharedTextFieldProps}
          name="notes"
          label="Internal notes"
          multiline
          minRows={3}
          maxRows={6}
          defaultValue={defaults.notes ?? ""}
          placeholder="Hours, access codes, certifications, equipment quirks…"
          InputProps={{
            startAdornment: (
              <InputAdornment
                position="start"
                sx={{ alignSelf: "flex-start", mt: 1.25, mr: 0.5 }}
              >
                <EditNoteOutlinedIcon />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );
}

export function PoolForm({
  action,
  defaults,
  poolId,
  orgIdField,
}: {
  action: (formData: FormData) => void;
  defaults: PoolFormValues;
  poolId?: string;
  orgIdField?: ReactNode;
}) {
  return (
    <Box component="form" action={action} sx={{ maxWidth: 560 }}>
      <PoolFormFields defaults={defaults} poolId={poolId} orgIdField={orgIdField} />
      <Button type="submit" variant="contained" sx={{ mt: 3 }}>
        Save pool
      </Button>
    </Box>
  );
}
