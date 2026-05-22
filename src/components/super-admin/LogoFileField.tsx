"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function LogoFileField({ name = "logo" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        Company logo (optional)
      </Typography>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Button type="button" variant="outlined" size="small" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <Typography variant="body2" color={fileName ? "text.primary" : "text.secondary"}>
          {fileName ?? "No file chosen"}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        PNG, JPG, WebP, or GIF · 5 MB max · optimized on upload
      </Typography>
    </Stack>
  );
}
