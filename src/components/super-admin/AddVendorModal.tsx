"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { upsertVendorAction } from "@/app/private/ae-console/platform/vendorActions";
import { LogoFileField } from "@/components/super-admin/LogoFileField";

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
  maxHeight: "min(90vh, 880px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

export function AddVendorModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={() => setOpen(true)}
        sx={{ alignSelf: "flex-start" }}
      >
        Add vendor
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
              Vendor directory
            </Typography>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Add vendor manually
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Same details as the public partner application at /vendors. Slug is generated automatically.
            </Typography>
          </Stack>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Box
          component="form"
          action={upsertVendorAction}
          sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <DialogContent
            dividers
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              px: 3,
              py: 2,
            }}
          >
            <Stack spacing={2}>
              <TextField name="company_name" label="Company name" required fullWidth size="small" />
              <LogoFileField />
              <TextField name="contact_name" label="Contact name" required fullWidth size="small" />
              <TextField name="email" label="Business email" type="email" required fullWidth size="small" />
              <TextField name="phone" label="Phone" type="tel" fullWidth size="small" />
              <TextField
                name="category"
                label="Category"
                placeholder="e.g. chemicals, pumps, saunas, services"
                fullWidth
                size="small"
              />
              <TextField
                name="website_url"
                label="Company website"
                type="url"
                placeholder="https://yourcompany.com"
                fullWidth
                size="small"
              />
              <TextField
                name="message"
                label="Description (optional)"
                multiline
                minRows={3}
                maxRows={8}
                fullWidth
                size="small"
                placeholder="Describe products, certifications, territories, and what they promote on the platform."
              />
              <FormControlLabel
                control={<Checkbox name="listing_visible" defaultChecked />}
                label="Visible in directory"
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
              bgcolor: "background.paper",
            }}
          >
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Add vendor
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
