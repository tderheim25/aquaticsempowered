"use client";

import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import { Button } from "@mui/material";
import { useState } from "react";

import { AddFacilityDialog } from "@/components/dashboard/AddFacilityDialog";

export function AddFacilityButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        fullWidth={!compact}
        size="small"
        variant="outlined"
        startIcon={<AddBusinessRoundedIcon />}
        onClick={() => setOpen(true)}
        sx={{ mx: compact ? 0 : 2, mb: compact ? 0 : 1 }}
      >
        Add facility
      </Button>
      <AddFacilityDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
