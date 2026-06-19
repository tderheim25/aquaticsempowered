"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";

import { CheckoutSuccessCelebration } from "@/components/billing/CheckoutSuccessCelebration";
import { EmbeddedCheckoutPanel } from "@/components/billing/EmbeddedCheckoutPanel";
import { confirmCheckoutPayment } from "@/lib/billing/confirmCheckoutPayment";

type ModalPhase = "checkout" | "celebrating";

type Props = {
  open: boolean;
  onClose: () => void;
  clientSecret: string | null;
  title?: string;
  planLabel?: string | null;
  onComplete?: () => void;
  celebrationDelayMs?: number;
};

export function EmbeddedCheckoutModal({
  open,
  onClose,
  clientSecret,
  title = "Complete your subscription",
  planLabel,
  onComplete,
  celebrationDelayMs = 1800,
}: Props) {
  const [phase, setPhase] = useState<ModalPhase>("checkout");

  useEffect(() => {
    if (!open) {
      setPhase("checkout");
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "celebrating" || !onComplete) return;

    let cancelled = false;
    let timer: number | undefined;

    void (async () => {
      if (clientSecret) {
        await confirmCheckoutPayment(clientSecret);
      }
      if (cancelled) return;
      timer = window.setTimeout(() => {
        if (!cancelled) onComplete();
      }, celebrationDelayMs);
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [phase, celebrationDelayMs, onComplete, clientSecret]);

  const canClose = phase === "checkout";

  return (
    <Dialog
      open={open}
      onClose={canClose ? onClose : undefined}
      fullWidth
      maxWidth="md"
      scroll="paper"
      slotProps={{
        paper: {
          sx: { borderRadius: 3, overflow: "hidden" },
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          pr: 6,
          display: phase === "celebrating" ? "none" : "block",
        }}
      >
        {title}
      </DialogTitle>
      {canClose ? (
        <IconButton
          aria-label="Close checkout"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      ) : null}

      <DialogContent sx={{ pt: phase === "celebrating" ? 0 : 1, pb: 3 }}>
        {phase === "celebrating" ? (
          <CheckoutSuccessCelebration planLabel={planLabel} compact />
        ) : clientSecret ? (
          <Stack spacing={2}>
            <EmbeddedCheckoutPanel
              clientSecret={clientSecret}
              onComplete={() => setPhase("celebrating")}
            />
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
