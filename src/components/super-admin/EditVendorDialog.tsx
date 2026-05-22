"use client";

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
import Image from "next/image";

import { upsertVendorAction } from "@/app/private/ae-console/platform/vendorActions";
import { LogoFileField } from "@/components/super-admin/LogoFileField";
import type { VendorContact, VendorListRow } from "@/components/super-admin/vendorConsoleTypes";
import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";

const dialogPaperSx = {
  borderRadius: 3,
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
  maxHeight: "min(90vh, 880px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
} as const;

export function EditVendorDialog({
  vendor,
  onClose,
}: {
  vendor: VendorListRow | null;
  onClose: () => void;
}) {
  const contact = (vendor?.contact ?? null) as VendorContact | null;
  const logoUrl = resolveVendorImageUrl(vendor?.logo_url ?? null);

  return (
    <Dialog
      open={Boolean(vendor)}
      onClose={onClose}
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
            Edit vendor
          </Typography>
          {vendor ? (
            <Typography variant="body2" color="text.secondary">
              Update listing details for {vendor.name}. Public profile: /vendors/{vendor.slug ?? "—"}
            </Typography>
          ) : null}
        </Stack>
        <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      {vendor ? (
        <Box
          key={vendor.id}
          component="form"
          action={upsertVendorAction}
          onSubmit={() => setTimeout(onClose, 0)}
          sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <input type="hidden" name="vendorId" value={vendor.id} />
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
              {logoUrl ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      position: "relative",
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      overflow: "hidden",
                      border: 1,
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  >
                    <Image src={logoUrl} alt="" fill style={{ objectFit: "contain" }} sizes="48px" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Upload a new file below, or use Replace in the directory table.
                  </Typography>
                </Stack>
              ) : null}
              <TextField name="company_name" label="Company name" required fullWidth size="small" defaultValue={vendor.name} />
              <TextField
                name="slug"
                label="URL slug"
                fullWidth
                size="small"
                defaultValue={vendor.slug ?? ""}
                helperText="Used in /vendors/your-slug"
              />
              <TextField name="tagline" label="Tagline" fullWidth size="small" defaultValue={vendor.tagline ?? ""} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  name="contact_name"
                  label="Contact name"
                  required
                  fullWidth
                  size="small"
                  defaultValue={contact?.name ?? ""}
                />
                <TextField
                  name="email"
                  label="Business email"
                  type="email"
                  required
                  fullWidth
                  size="small"
                  defaultValue={contact?.email ?? ""}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField name="phone" label="Phone" type="tel" fullWidth size="small" defaultValue={contact?.phone ?? ""} />
                <TextField name="category" label="Category" fullWidth size="small" defaultValue={vendor.category ?? ""} />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  name="region"
                  label="Region"
                  fullWidth
                  size="small"
                  defaultValue={vendor.region ?? ""}
                  placeholder="e.g. Ontario"
                />
                <TextField
                  name="website_url"
                  label="Company website"
                  fullWidth
                  size="small"
                  defaultValue={vendor.website_url ?? ""}
                  placeholder="https://..."
                />
              </Stack>
              <TextField
                name="description"
                label="Description (optional)"
                multiline
                minRows={3}
                maxRows={8}
                fullWidth
                size="small"
                defaultValue={vendor.description ?? ""}
              />
              <LogoFileField />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <FormControlLabel
                  control={<Checkbox name="listing_visible" defaultChecked={vendor.listing_visible} />}
                  label="Visible in directory"
                />
                <FormControlLabel
                  control={<Checkbox name="is_partner" defaultChecked={vendor.is_partner} />}
                  label="Featured partner"
                />
              </Stack>
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
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save changes
            </Button>
          </DialogActions>
        </Box>
      ) : null}
    </Dialog>
  );
}
