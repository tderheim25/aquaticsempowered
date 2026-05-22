"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import Image from "next/image";

import { deleteVendorProductAction, upsertVendorProductAction } from "@/app/private/ae-console/platform/vendorActions";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import type { VendorListRow, VendorProductRow } from "@/components/super-admin/vendorConsoleTypes";
import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";

export type { VendorProductRow };

export function VendorProductsSection({
  vendorsList,
  products,
}: {
  vendorsList: VendorListRow[];
  products: VendorProductRow[];
}) {
  const vendorNameById = new Map(vendorsList.map((v) => [v.id, v.name]));

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Select a vendor, upload a product photo, and publish to the public marketplace on{" "}
        <Typography component="span" fontWeight={600}>
          /vendors
        </Typography>
        .
      </Typography>

      <AeConsolePanel>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Add product
        </Typography>
        <Stack component="form" action={upsertVendorProductAction} spacing={2} sx={{ maxWidth: 640 }}>
          <TextField
            name="vendorId"
            label="Vendor"
            select
            required
            size="small"
            fullWidth
            defaultValue={vendorsList[0]?.id ?? ""}
            disabled={vendorsList.length === 0}
          >
            {vendorsList.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField name="name" label="Item name" required size="small" fullWidth />
          <TextField name="description" label="Description" multiline rows={4} size="small" fullWidth />
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Product photo
            </Typography>
            <TextField name="image" type="file" size="small" inputProps={{ accept: "image/jpeg,image/png,image/webp,image/gif" }} />
            <Typography variant="caption" color="text.secondary">
              Or paste an image URL below (max 5 MB; uploads are resized and compressed while preserving quality)
            </Typography>
          </Stack>
          <TextField name="image_url" label="Image URL (optional)" size="small" fullWidth placeholder="https://..." />
          <TextField name="product_url" label="Product link (optional)" size="small" fullWidth placeholder="https://..." />
          <FormControlLabel control={<Checkbox name="is_visible" defaultChecked />} label="Visible on marketplace" />
          <Button type="submit" variant="contained" disabled={vendorsList.length === 0} sx={{ alignSelf: "flex-start" }}>
            Publish product
          </Button>
        </Stack>
      </AeConsolePanel>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Published products ({products.length})
      </Typography>

      {products.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No products yet. Add a vendor in Directory first, then publish products here.
        </Typography>
      ) : (
        <AeConsolePanel noPadding>
          <DataTable embedded>
            <TableHead>
              <TableRow>
                <TableCell width={72}>Photo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Visible</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => {
                const img = resolveVendorImageUrl(p.image_url);
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      {img ? (
                        <Box sx={{ position: "relative", width: 48, height: 48, borderRadius: 1, overflow: "hidden" }}>
                          <Image src={img} alt="" fill style={{ objectFit: "cover" }} sizes="48px" />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            color: "text.secondary",
                          }}
                        >
                          —
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <TablePrimaryCell
                        primary={p.name}
                        secondary={
                          p.description
                            ? `${p.description.slice(0, 80)}${p.description.length > 80 ? "…" : ""}`
                            : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>{vendorNameById.get(p.vendor_id) ?? "—"}</TableCell>
                    <TableCell>
                      <StatusPill label={p.is_visible ? "Visible" : "Hidden"} tone={p.is_visible ? "success" : "neutral"} />
                    </TableCell>
                    <TableCell align="right">
                      <form action={deleteVendorProductAction}>
                        <input type="hidden" name="productId" value={p.id} />
                        <IconButton type="submit" size="small" color="error" aria-label="Delete product">
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </AeConsolePanel>
      )}
    </Stack>
  );
}
