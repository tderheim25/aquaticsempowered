"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { deleteVendorProductAction, saveVendorProductAction } from "@/app/(dashboard)/app/vendor/actions";
import { communityContainedButtonSx } from "@/components/community/communityUi";
import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";

export type VendorProductItem = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  product_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
};

const FIELD_IDS = {
  name: "vendor-product-name",
  description: "vendor-product-description",
  imageUrl: "vendor-product-image-url",
  productUrl: "vendor-product-product-url",
} as const;

function statusMessage(status: string | null) {
  switch (status) {
    case "saved":
      return { severity: "success" as const, text: "Product saved." };
    case "deleted":
      return { severity: "success" as const, text: "Product removed." };
    case "upload_error":
      return { severity: "error" as const, text: "Image upload failed. Use JPEG, PNG, WebP, or GIF under 5 MB." };
    case "invalid":
      return { severity: "error" as const, text: "Product name is required." };
    case "not_found":
      return { severity: "error" as const, text: "Product not found." };
    case "error":
      return { severity: "error" as const, text: "Could not save product. Try again." };
    default:
      return null;
  }
}

function ProductFormFields({ product }: { product?: VendorProductItem | null }) {
  return (
    <Stack spacing={2}>
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <TextField
        id={FIELD_IDS.name}
        name="name"
        label="Product name"
        required
        size="small"
        fullWidth
        defaultValue={product?.name ?? ""}
      />
      <TextField
        id={FIELD_IDS.description}
        name="description"
        label="Description"
        multiline
        minRows={3}
        size="small"
        fullWidth
        defaultValue={product?.description ?? ""}
      />
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
          Product photo
        </Typography>
        <TextField
          name="image"
          type="file"
          size="small"
          fullWidth
          inputProps={{ accept: "image/jpeg,image/png,image/webp,image/gif" }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Max 5 MB. Leave empty to keep the current image when editing.
        </Typography>
      </Box>
      <TextField
        id={FIELD_IDS.imageUrl}
        name="image_url"
        label="Image URL (optional)"
        size="small"
        fullWidth
        placeholder="https://..."
        defaultValue={product?.image_url ?? ""}
      />
      <TextField
        id={FIELD_IDS.productUrl}
        name="product_url"
        label="Product page link (optional)"
        size="small"
        fullWidth
        placeholder="https://..."
        defaultValue={product?.product_url ?? ""}
      />
      <FormControlLabel
        control={<Checkbox name="is_visible" defaultChecked={product?.is_visible ?? true} />}
        label="Visible on marketplace"
      />
    </Stack>
  );
}

export function VendorProductsManager({ products }: { products: VendorProductItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const flash = statusMessage(params.get("status"));
  const [editProduct, setEditProduct] = useState<VendorProductItem | null>(null);

  const clearStatus = () => {
    router.replace("/app/vendor?tab=products");
  };

  return (
    <Stack spacing={3}>
      {flash ? (
        <Alert severity={flash.severity} onClose={clearStatus}>
          {flash.text}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
          Add a product
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          New listings appear on the public marketplace and community tab once marked visible.
        </Typography>
        <Box component="form" action={saveVendorProductAction}>
          <ProductFormFields />
          <Button type="submit" variant="contained" sx={{ mt: 2, ...communityContainedButtonSx() }}>
            Publish product
          </Button>
        </Box>
      </Paper>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
          Your products ({products.length})
        </Typography>

        {products.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No products yet. Add your first listing above.
          </Typography>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={72}>Photo</TableCell>
                  <TableCell>Name</TableCell>
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
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {p.name}
                        </Typography>
                        {p.description ? (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280, display: "block" }}>
                            {p.description}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color={p.is_visible ? "success.main" : "text.secondary"}>
                          {p.is_visible ? "Yes" : "Hidden"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label="Edit product" onClick={() => setEditProduct(p)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <Box component="form" action={deleteVendorProductAction} sx={{ display: "inline" }}>
                          <input type="hidden" name="productId" value={p.id} />
                          <IconButton type="submit" size="small" color="error" aria-label="Delete product">
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      <Dialog open={Boolean(editProduct)} onClose={() => setEditProduct(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit product</DialogTitle>
        <Box component="form" action={saveVendorProductAction} id="vendor-product-edit-form">
          <DialogContent>
            <ProductFormFields product={editProduct} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={communityContainedButtonSx()}>
              Save changes
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
