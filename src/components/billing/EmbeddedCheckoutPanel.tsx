"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import { getStripeClient } from "@/lib/stripe/loadStripeClient";

type Props = {
  clientSecret: string;
  onComplete?: () => void;
  title?: string;
};

export function EmbeddedCheckoutPanel({ clientSecret, onComplete, title }: Props) {
  const stripePromise = useMemo(() => getStripeClient(), []);

  if (!stripePromise) {
    return (
      <Alert severity="warning">
        Stripe publishable key is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {title ? (
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      ) : null}
      <Box
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
          minHeight: 420,
          bgcolor: "background.paper",
        }}
      >
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            onComplete: onComplete
              ? () => {
                  onComplete();
                }
              : undefined,
          }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </Box>
      {!clientSecret ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}
    </Stack>
  );
}
