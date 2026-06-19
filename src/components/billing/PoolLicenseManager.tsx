"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmbeddedCheckoutModal } from "@/components/billing/EmbeddedCheckoutModal";
import { POOL_ADDON_MONTHLY_USD } from "@/lib/marketing/publicPricing";
import type { PoolLicenseSnapshot } from "@/lib/billing/poolLicenseTypes";

type ApiPurchaseResponse =
  | { ok: true; purchased: number }
  | { code: "payment_required"; clientSecret: string }
  | { error?: string; code?: string };

export function PoolLicenseManager({
  initialSnapshot,
  canPurchase = true,
  purchaseBlockedReason = null,
}: {
  initialSnapshot: PoolLicenseSnapshot | null;
  canPurchase?: boolean;
  purchaseBlockedReason?: string | null;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<PoolLicenseSnapshot | null>(initialSnapshot);
  const [buyQty, setBuyQty] = useState(1);
  const [releaseQty, setReleaseQty] = useState(1);
  const [loading, setLoading] = useState<"buy" | "release" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    const res = await fetch("/api/billing/pool-licenses");
    if (!res.ok) return;
    const data = (await res.json()) as PoolLicenseSnapshot;
    setSnapshot(data);
  }, []);

  useEffect(() => {
    if (!initialSnapshot) {
      void refreshSnapshot();
    }
  }, [initialSnapshot, refreshSnapshot]);

  if (!snapshot) {
    return (
      <Stack alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  async function handlePurchase(quantity: number) {
    if (!canPurchase) {
      setError(purchaseBlockedReason ?? "Pool add-on purchases are not available right now.");
      return;
    }

    setLoading("buy");
    setError(null);
    setSuccess(null);
    setPaymentSecret(null);
    setPaymentModalOpen(false);

    try {
      const res = await fetch("/api/stripe/pool-licenses/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = (await res.json()) as ApiPurchaseResponse;

      if (res.ok && "ok" in data && data.ok) {
        setSuccess(
          quantity === 1
            ? "Pool add-on purchased. You can add another active pool now."
            : `${quantity} pool add-ons purchased.`,
        );
        await refreshSnapshot();
        router.refresh();
        return;
      }

      if ("code" in data && data.code === "payment_required" && "clientSecret" in data && data.clientSecret) {
        setPaymentSecret(data.clientSecret);
        setPaymentModalOpen(true);
        return;
      }

      setError(("error" in data && data.error) || "Could not purchase pool add-ons.");
    } catch {
      setError("Could not reach the billing service.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRelease() {
    setLoading("release");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/stripe/pool-licenses/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: releaseQty }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; released?: number };

      if (res.ok && data.ok) {
        setSuccess(
          data.released === 1
            ? "Released 1 unused pool add-on."
            : `Released ${data.released ?? releaseQty} unused pool add-ons.`,
        );
        await refreshSnapshot();
        router.refresh();
      } else {
        setError(data.error ?? "Could not release pool add-ons.");
      }
    } catch {
      setError("Could not reach the billing service.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Pool add-ons:{" "}
        <strong>{snapshot.purchased} purchased</strong> · <strong>{snapshot.assigned} in use</strong> ·{" "}
        <strong>{snapshot.available} available</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Your first active pool is included. Each additional active pool needs a pool add-on at $
        {POOL_ADDON_MONTHLY_USD}/mo. Buy add-ons in advance or pay when adding a pool. Removing a pool
        frees an add-on slot; release unused add-ons to stop billing.
      </Typography>

      {!canPurchase && purchaseBlockedReason ? (
        <Alert severity="warning">{purchaseBlockedReason}</Alert>
      ) : null}
      {error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            aria-label="Decrease add-ons to buy"
            onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
          >
            <RemoveRoundedIcon fontSize="small" />
          </IconButton>
          <TextField
            size="small"
            label="Quantity"
            type="number"
            value={buyQty}
            onChange={(e) => setBuyQty(Math.max(1, Number(e.target.value) || 1))}
            inputProps={{ min: 1, max: 50 }}
            sx={{ width: 120 }}
          />
          <IconButton
            size="small"
            aria-label="Increase add-ons to buy"
            onClick={() => setBuyQty((q) => Math.min(50, q + 1))}
          >
            <AddRoundedIcon fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            disabled={loading === "buy" || !canPurchase}
            onClick={() => void handlePurchase(buyQty)}
          >
            {loading === "buy" ? <CircularProgress size={20} color="inherit" /> : "Buy add-ons"}
          </Button>
        </Stack>

        {snapshot.available > 0 ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Release"
              type="number"
              value={releaseQty}
              onChange={(e) =>
                setReleaseQty(Math.min(snapshot.available, Math.max(1, Number(e.target.value) || 1)))
              }
              inputProps={{ min: 1, max: snapshot.available }}
              sx={{ width: 100 }}
            />
            <Button
              variant="outlined"
              disabled={loading === "release"}
              onClick={() => void handleRelease()}
            >
              {loading === "release" ? (
                <CircularProgress size={20} />
              ) : (
                "Release unused"
              )}
            </Button>
          </Stack>
        ) : null}
      </Stack>

      <EmbeddedCheckoutModal
        open={paymentModalOpen && Boolean(paymentSecret)}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentSecret(null);
        }}
        clientSecret={paymentSecret}
        title="Complete pool add-on payment"
        planLabel="Pool add-on"
        onComplete={() => {
          setPaymentModalOpen(false);
          setPaymentSecret(null);
          void refreshSnapshot();
          router.refresh();
        }}
      />
    </Stack>
  );
}

export function PoolLicenseInlinePurchase({
  quantity = 1,
  onComplete,
  onCancel,
}: {
  quantity?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  async function startPurchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/pool-licenses/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = (await res.json()) as ApiPurchaseResponse;
      if (res.ok && "ok" in data && data.ok) {
        onComplete?.();
        return;
      }
      if ("code" in data && data.code === "payment_required" && "clientSecret" in data && data.clientSecret) {
        setPaymentSecret(data.clientSecret);
        setPaymentModalOpen(true);
        return;
      }
      setError(("error" in data && data.error) || "Could not purchase a pool add-on.");
    } catch {
      setError("Could not reach the billing service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void startPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (paymentSecret) {
    return (
      <EmbeddedCheckoutModal
        open={paymentModalOpen && Boolean(paymentSecret)}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentSecret(null);
          onCancel?.();
        }}
        clientSecret={paymentSecret}
        title="Pay for pool add-on"
        planLabel="Pool add-on"
        onComplete={() => {
          setPaymentModalOpen(false);
          setPaymentSecret(null);
          onComplete?.();
        }}
      />
    );
  }

  return (
    <Box>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : null}
      {onCancel ? (
        <Button variant="text" onClick={onCancel} sx={{ mt: 1 }}>
          Cancel
        </Button>
      ) : null}
    </Box>
  );
}
