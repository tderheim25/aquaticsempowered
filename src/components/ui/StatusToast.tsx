"use client";

import { Alert, type AlertColor, Snackbar, Slide, type SlideProps } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { softUiTokens } from "@/theme/softUiTokens";

export type StatusToastMessage = {
  /** The text displayed in the toast body. */
  text: string;
  /** MUI Alert severity. Defaults to "success". */
  severity?: AlertColor;
};

export type StatusToastMessages = Record<string, StatusToastMessage>;

const FALLBACK_MESSAGES: StatusToastMessages = {
  error: { text: "Something went wrong. Please try again.", severity: "error" },
  invalid: { text: "Some fields are missing or invalid.", severity: "error" },
};

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

/**
 * Renders a toast (MUI Snackbar) for status flash messages that arrive as
 * a `?status=...` URL parameter (typical for Next.js server-action redirects).
 *
 * Once the toast is shown the `status` param is silently scrubbed from the URL
 * so a page refresh does not re-trigger the toast.
 *
 * Pass a `messages` map describing each status code your section produces.
 * Unknown codes fall back to generic error/invalid copy or are ignored.
 */
export function StatusToast({
  status,
  messages,
  paramName = "status",
  autoHideMs = 4000,
}: {
  status?: string | null;
  messages?: StatusToastMessages;
  paramName?: string;
  autoHideMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolved = (() => {
    if (!status) return null;
    const custom = messages?.[status];
    if (custom) return custom;
    return FALLBACK_MESSAGES[status] ?? null;
  })();

  const [open, setOpen] = useState(Boolean(resolved));

  useEffect(() => {
    if (!resolved) return;
    setOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    const next = params.toString();
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    // We intentionally only run this when the status string changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!resolved) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideMs}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      slots={{ transition: SlideTransition }}
      sx={{ maxWidth: 420 }}
    >
      <Alert
        elevation={0}
        variant="standard"
        severity={resolved.severity ?? "success"}
        onClose={() => setOpen(false)}
        sx={{
          borderRadius: 3,
          alignItems: "center",
          fontWeight: 500,
          boxShadow: softUiTokens.shadow.raised,
          border: "1px solid rgba(15, 35, 54, 0.06)",
          fontFamily: "var(--font-jakarta), var(--font-inter), sans-serif",
          "& .MuiAlert-icon": { alignItems: "center" },
        }}
      >
        {resolved.text}
      </Alert>
    </Snackbar>
  );
}
