"use client";

import { Alert, Box, Button, Snackbar, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
const SIGNUP_COOLDOWN_SECONDS = 60;

function parseSignupError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase();
  const isRateLimited = normalized.includes("email rate limit exceeded") || normalized.includes("rate limit");
  if (isRateLimited) {
    return {
      isRateLimited,
      message: "Too many signup attempts. Please wait about a minute before trying again.",
    };
  }
  return { isRateLimited, message: rawMessage };
}

export function EmailPasswordForm({ mode, nextPath = "/app" }: { mode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (cooldownLeft <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && cooldownLeft > 0) return;

    setStatus("loading");
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          setToast(error.message);
          return;
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
        },
      });

      if (error) {
        const parsedError = mode === "signup" ? parseSignupError(error.message) : null;
        const friendlyMessage = parsedError?.message ?? error.message;
        if (parsedError?.isRateLimited) {
          setCooldownLeft(SIGNUP_COOLDOWN_SECONDS);
        }
        setStatus("error");
        setMessage(friendlyMessage);
        setToast(friendlyMessage);
        return;
      }

      setStatus("success");
      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setMessage("Account created. Check your email to confirm your account, then sign in.");
      router.push("/login?registered=1");
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

      <TextField
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        margin="normal"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {mode === "signup" && (
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          margin="normal"
          autoComplete="new-password"
        />
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={status === "loading" || (mode === "signup" && cooldownLeft > 0)}
        sx={{ mt: 2 }}
      >
        {status === "loading"
          ? mode === "login"
            ? "Signing in..."
            : "Creating account..."
          : mode === "signup" && cooldownLeft > 0
            ? `Please wait ${cooldownLeft}s`
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </Button>

      {status === "success" && message && (
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
