"use client";

import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { Button, CircularProgress } from "@mui/material";
import { useRef, useTransition } from "react";

import { uploadUserAvatarAction } from "@/app/(dashboard)/app/profile/actions";

export function AvatarUploadButton({ redirectTo }: { redirectTo?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={uploadUserAvatarAction}>
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      <Button
        variant="outlined"
        component="label"
        size="small"
        disabled={pending}
        startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera />}
      >
        {pending ? "Uploading…" : "Upload photo"}
        <input
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          hidden
          disabled={pending}
          onChange={(e) => {
            const input = e.currentTarget;
            if (!input.files?.[0]) return;
            startTransition(() => {
              formRef.current?.requestSubmit();
            });
            input.value = "";
          }}
        />
      </Button>
    </form>
  );
}
