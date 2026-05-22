"use client";

import LockRoundedIcon from "@mui/icons-material/LockRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BRAND_NAVY, BRAND_NAVY_MID, BRAND_TEAL } from "@/components/community/communityUi";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
const SIGNUP_COOLDOWN_SECONDS = 60;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
`;

const sheen = keyframes`
  0%   { background-position: -150% 0; }
  60%  { background-position: 150% 0; }
  100% { background-position: 150% 0; }
`;

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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    transition: "all 220ms cubic-bezier(0.2,0.8,0.2,1)",
    "& fieldset": {
      borderColor: "rgba(0, 59, 111, 0.18)",
      transition: "all 220ms ease",
    },
    "&:hover fieldset": {
      borderColor: "rgba(0, 59, 111, 0.4)",
    },
    "&.Mui-focused": {
      background: "#fff",
      boxShadow: "0 0 0 4px rgba(46,165,160,0.15)",
    },
    "&.Mui-focused fieldset": {
      borderColor: BRAND_TEAL,
      borderWidth: 1.5,
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: BRAND_NAVY,
  },
} as const;

export function EmailPasswordForm({
  mode,
  nextPath = "/app",
  inviteToken,
  lockedEmail,
  defaultFullName,
}: {
  mode: Mode;
  nextPath?: string;
  inviteToken?: string;
  lockedEmail?: string;
  defaultFullName?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName ?? "");
  const [email, setEmail] = useState(lockedEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (cooldownLeft <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  function flashError(msg: string) {
    setStatus("error");
    setMessage(msg);
    setToast(msg);
    setShakeKey((k) => k + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && cooldownLeft > 0) return;

    setStatus("loading");
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      flashError("Passwords do not match.");
      return;
    }

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          flashError(error.message);
          return;
        }

        router.push(nextPath);
        router.refresh();
        return;
      }

      const metadata: Record<string, string> = {};
      if (fullName.trim()) metadata.full_name = fullName.trim();
      if (inviteToken) metadata.invite_token = inviteToken;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: Object.keys(metadata).length ? metadata : undefined,
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/callback?next=${encodeURIComponent(nextPath)}`
              : undefined,
        },
      });

      if (error) {
        const parsedError = mode === "signup" ? parseSignupError(error.message) : null;
        const friendlyMessage = parsedError?.message ?? error.message;
        if (parsedError?.isRateLimited) {
          setCooldownLeft(SIGNUP_COOLDOWN_SECONDS);
        }
        flashError(friendlyMessage);
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
      flashError(msg);
    }
  }

  const isLoading = status === "loading";
  const isDisabled = isLoading || (mode === "signup" && cooldownLeft > 0);
  const submitLabel = isLoading
    ? mode === "login"
      ? "Signing in…"
      : "Creating account…"
    : mode === "signup" && cooldownLeft > 0
      ? `Please wait ${cooldownLeft}s`
      : mode === "login"
        ? "Sign in"
        : "Create account";

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      key={shakeKey}
      sx={{
        animation: status === "error" ? `${shake} 420ms cubic-bezier(.36,.07,.19,.97)` : "none",
      }}
    >
      {mode === "signup" && (
        <TextField
          label="Full name"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          fullWidth
          required
          margin="normal"
          sx={fieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        required
        margin="normal"
        disabled={Boolean(lockedEmail)}
        helperText={lockedEmail ? "Email locked from invitation." : undefined}
        sx={fieldSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MailOutlineRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        margin="normal"
        sx={fieldSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                sx={{ color: "text.secondary" }}
              >
                {showPassword ? (
                  <VisibilityOffRoundedIcon fontSize="small" />
                ) : (
                  <VisibilityRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {mode === "signup" && (
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
          required
          margin="normal"
          sx={fieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  sx={{ color: "text.secondary" }}
                >
                  {showConfirmPassword ? (
                    <VisibilityOffRoundedIcon fontSize="small" />
                  ) : (
                    <VisibilityRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={isDisabled}
        startIcon={isLoading ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : null}
        sx={{
          position: "relative",
          mt: 2.5,
          py: 1.4,
          borderRadius: 2,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "none",
          fontSize: "1rem",
          color: "common.white",
          background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_NAVY_MID} 60%, ${BRAND_TEAL} 100%)`,
          boxShadow:
            "0 14px 26px -14px rgba(0, 59, 111, 0.55), 0 6px 14px -8px rgba(0, 59, 111, 0.35)",
          overflow: "hidden",
          transition: "transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            opacity: 0,
            transition: "opacity 200ms ease",
          },
          "&:hover": {
            transform: isDisabled ? undefined : "translateY(-1px)",
            boxShadow:
              "0 20px 38px -16px rgba(0, 59, 111, 0.6), 0 10px 20px -10px rgba(0, 59, 111, 0.4)",
          },
          "&:hover::after": {
            opacity: isDisabled ? 0 : 1,
            animation: `${sheen} 1.1s ease`,
          },
          "&:active": {
            transform: isDisabled ? undefined : "translateY(0)",
          },
          "&.Mui-disabled": {
            color: "rgba(255,255,255,0.85)",
            background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_NAVY_MID} 100%)`,
            opacity: 0.7,
          },
        }}
      >
        {submitLabel}
      </Button>

      <Collapse in={status === "success" && Boolean(message)}>
        <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Collapse>

      <Collapse in={status === "error" && Boolean(message)}>
        <Alert severity="error" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          {message}
        </Alert>
      </Collapse>

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
