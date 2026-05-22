"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { createPoolAction } from "@/app/(dashboard)/app/pools/actions";
import { PoolFormFields } from "@/components/pools/PoolForm";

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
  maxHeight: "min(90vh, 720px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

export type OrgOption = { id: string; name: string };

export function AddPoolModal({
  orgId,
  orgOptions,
  showOrgPicker,
  status,
  defaultOpen,
}: {
  orgId: string;
  orgOptions?: OrgOption[];
  showOrgPicker?: boolean;
  status?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const invalid = status === "invalid";
  const error = status === "error";

  return (
    <>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
        Add pool
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            px: 3,
            pt: 2.5,
            pb: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0, pr: 1 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Pools
            </Typography>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Add pool
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a pool profile for chemical logs, maintenance, and monitoring.
            </Typography>
          </Stack>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box
          component="form"
          action={createPoolAction}
          sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3, py: 2 }}>
            <Stack spacing={2}>
              {invalid ? <Alert severity="error">Check required fields and try again.</Alert> : null}
              {error ? <Alert severity="error">Could not save pool. Please try again.</Alert> : null}
              <PoolFormFields
                defaults={{
                  name: "",
                  pool_type: "chlorine",
                  status: "active",
                  volume_gallons: null,
                  location_label: null,
                  notes: null,
                }}
                orgIdField={
                  showOrgPicker && orgOptions?.length ? (
                    <TextField name="orgId" label="Organization" select required fullWidth size="small" defaultValue={orgId}>
                      {orgOptions.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                          {o.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <input type="hidden" name="orgId" value={orgId} />
                  )
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{
              flexShrink: 0,
              px: 3,
              py: 2,
              gap: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button variant="outlined" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save pool
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
