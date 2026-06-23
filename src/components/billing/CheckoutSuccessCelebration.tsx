"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Avatar, Stack, Typography } from "@mui/material";
import confetti from "canvas-confetti";
import { useEffect } from "react";

type Props = {
  planLabel?: string | null;
  headline?: string;
  subline?: string;
  compact?: boolean;
};

function fireConfetti() {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const duration = 2200;
  const end = Date.now() + duration;
  const colors = ["#003B6F", "#2EA5A0", "#ffffff", "#4FC3B7"];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 1400,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 1400,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    zIndex: 1400,
  });
  frame();
}

export function CheckoutSuccessCelebration({
  planLabel,
  headline,
  subline,
  compact = false,
}: Props) {
  useEffect(() => {
    fireConfetti();
  }, []);

  const title =
    headline ??
    (planLabel
      ? `Welcome! Your ${planLabel} subscription is active.`
      : "Welcome! Your subscription is active.");

  const body =
    subline ??
    (planLabel
      ? `You're subscribed to ${planLabel}. Your workspace is syncing — open the dashboard when you're ready.`
      : "Payment succeeded. Your workspace is syncing now.");

  return (
    <Stack
      spacing={compact ? 1.5 : 2.5}
      alignItems="center"
      sx={{ py: compact ? 2 : 4, px: 2, textAlign: "center" }}
    >
      <Avatar
        sx={{
          width: compact ? 56 : 72,
          height: compact ? 56 : 72,
          background: "linear-gradient(135deg, #003B6F 0%, #2EA5A0 100%)",
          boxShadow: "0 18px 36px rgba(0,59,111,0.25)",
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: compact ? 28 : 36 }} />
      </Avatar>
      <Typography variant={compact ? "h6" : "h5"} sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {body}
      </Typography>
    </Stack>
  );
}
