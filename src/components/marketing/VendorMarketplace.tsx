"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ProductInquiryDialog } from "@/components/marketing/ProductInquiryDialog";
import type { MarketplaceProduct } from "@/lib/vendors/loadVendorMarketplace";

function ProductCard({ product, onOpen }: { product: MarketplaceProduct; onOpen: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        width: "100%",
        textAlign: "left",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "background.paper",
        cursor: "pointer",
        p: 0,
        display: "block",
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "transform", "border-color"], {
            duration: theme.transitions.duration.shorter,
          }),
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
          borderColor: "primary.light",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
        }}
      >
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="(max-width:600px) 100vw, 25vw" style={{ objectFit: "cover" }} />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
            <StorefrontOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          </Stack>
        )}
      </Box>
      <Stack spacing={0.5} sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {product.vendor.name}
        </Typography>
      </Stack>
    </Box>
  );
}

export function VendorMarketplace({
  products,
  signedIn = false,
}: {
  products: MarketplaceProduct[];
  signedIn?: boolean;
}) {
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  if (products.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          px: 3,
          textAlign: "center",
          borderRadius: 2.5,
          border: "1px dashed",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Marketplace coming soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Approved vendor products will appear here. Check back after our team publishes listings.
        </Typography>
      </Box>
    );
  }

  const v = selected?.vendor;

  return (
    <>
      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
            <ProductCard product={product} onOpen={() => setSelected(product)} />
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: "hidden" },
        }}
      >
        {selected && v ? (
          <>
            <IconButton
              onClick={() => setSelected(null)}
              aria-label="Close"
              sx={{ position: "absolute", right: 12, top: 12, zIndex: 2, bgcolor: "background.paper" }}
            >
              <CloseRoundedIcon />
            </IconButton>
            <DialogContent sx={{ p: 0 }}>
              <Grid container>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ position: "relative", width: "100%", minHeight: { xs: 280, md: 360 }, bgcolor: "grey.100" }}>
                    {selected.image_url ? (
                      <Image
                        src={selected.image_url}
                        alt={selected.name}
                        fill
                        sizes="(max-width: 900px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                        priority
                      />
                    ) : (
                      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", minHeight: 280 }}>
                        <StorefrontOutlinedIcon sx={{ fontSize: 64, color: "text.disabled" }} />
                      </Stack>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={2} sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={0.5}>
                      <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
                        Product
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {selected.name}
                      </Typography>
                    </Stack>
                    {selected.description ? (
                      <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                        {selected.description}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ alignSelf: "flex-start" }}>
                      <Button variant="contained" onClick={() => setInquiryOpen(true)}>
                        Ask about this product
                      </Button>
                      {selected.product_url ? (
                        <Button
                          component="a"
                          href={selected.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                        >
                          View product page
                        </Button>
                      ) : null}
                    </Stack>

                    <Box sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Vendor
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        {v.logo_url ? (
                          <Box sx={{ position: "relative", width: 56, height: 56, borderRadius: 1.5, overflow: "hidden", flexShrink: 0 }}>
                            <Image src={v.logo_url} alt="" fill style={{ objectFit: "contain" }} />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1.5,
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "1.25rem",
                              flexShrink: 0,
                            }}
                          >
                            {v.name.charAt(0)}
                          </Box>
                        )}
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {v.name}
                          </Typography>
                          {v.tagline ? (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {v.tagline}
                            </Typography>
                          ) : null}
                          {v.category ? <Chip label={v.category} size="small" sx={{ alignSelf: "flex-start", mt: 0.5 }} /> : null}
                        </Stack>
                      </Stack>
                      {v.description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                          {v.description}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                        {v.slug ? (
                          <Button component={Link} href={`/vendors/${v.slug}`} variant="outlined" size="small">
                            Vendor profile
                          </Button>
                        ) : null}
                        {v.website_url ? (
                          <Button
                            component="a"
                            href={v.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="text"
                            size="small"
                          >
                            Website
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        ) : null}
      </Dialog>

      <ProductInquiryDialog
        product={selected}
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        signedIn={signedIn}
      />
    </>
  );
}
