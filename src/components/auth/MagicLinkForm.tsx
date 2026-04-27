"use client";

import { Alert, Box, Button, Snackbar, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site";

type Mode = "login" | "signup" | "forgot";

export function MagicLinkForm({ mode, nextPath = "/app" }: { mode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${getSiteUrl()}/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: mode === "signup",
          data: mode === "signup" && fullName.trim() ? { full_name: fullName.trim() } : undefined,
        },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        setToast(error.message);
        return;
      }
      setStatus("sent");
      setMessage("Check your email for the magic link.");
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStatus("error");
      setMessage(msg);
      setToast(msg);
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit}>
      {mode === "signup" && (
        <TextField
          label="Full name"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
          required
          margin="normal"
          autoComplete="name"
        />
      )}
      <TextField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        margin="normal"
        autoComplete="email"
      />
      <Button type="submit" variant="contained" color="primary" fullWidth size="large" disabled={status === "loading"} sx={{ mt: 2 }}>
        {status === "loading" ? "Sending…" : mode === "forgot" ? "Send reset link" : "Send magic link"}
      </Button>
      {status === "sent" && (
        <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
      {status === "error" && message && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setToast(null)} sx={{ width: "100%" }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
