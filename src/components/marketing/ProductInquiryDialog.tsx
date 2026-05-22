"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";

import type { MarketplaceProduct } from "@/lib/vendors/loadVendorMarketplace";

const INQUIRY_NAME_ID = "product-inquiry-name";
const INQUIRY_EMAIL_ID = "product-inquiry-email";
const INQUIRY_ORG_ID = "product-inquiry-org";
const INQUIRY_MESSAGE_ID = "product-inquiry-message";

export function ProductInquiryDialog({
  product,
  open,
  onClose,
  signedIn,
}: {
  product: MarketplaceProduct | null;
  open: boolean;
  onClose: () => void;
  /** When true, name/email are taken from the session server-side. */
  signedIn: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const message = String(fd.get("message") ?? "").trim();
    if (message.length < 3) {
      setError("Please enter a message (at least 3 characters).");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/marketplace/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            message,
            fromName: signedIn ? undefined : String(fd.get("fromName") ?? "").trim(),
            fromEmail: signedIn ? undefined : String(fd.get("fromEmail") ?? "").trim(),
            fromOrgName: String(fd.get("fromOrgName") ?? "").trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (data.error === "contact_required") {
            setError("Enter your name and email so the vendor can respond.");
          } else {
            setError("Could not send inquiry. Try again.");
          }
          return;
        }
        setSuccess(true);
        e.currentTarget.reset();
      } catch {
        setError("Could not send inquiry. Try again.");
      }
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Ask about this product
        {product ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
            {product.name} · {product.vendor.name}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success">
            Your inquiry was sent. The vendor will see it in their dashboard and can reply by email.
          </Alert>
        ) : (
          <Stack component="form" id="product-inquiry-form" spacing={2} onSubmit={handleSubmit}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {!signedIn ? (
              <>
                <TextField id={INQUIRY_NAME_ID} name="fromName" label="Your name" required size="small" fullWidth />
                <TextField
                  id={INQUIRY_EMAIL_ID}
                  name="fromEmail"
                  label="Email"
                  type="email"
                  required
                  size="small"
                  fullWidth
                />
              </>
            ) : null}
            <TextField id={INQUIRY_ORG_ID} name="fromOrgName" label="Organization (optional)" size="small" fullWidth />
            <TextField
              id={INQUIRY_MESSAGE_ID}
              name="message"
              label="Message"
              required
              multiline
              minRows={3}
              fullWidth
              placeholder="Pricing, availability, specs, delivery…"
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>{success ? "Close" : "Cancel"}</Button>
        {!success ? (
          <Button type="submit" form="product-inquiry-form" variant="contained" disabled={pending || !product}>
            Send inquiry
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
