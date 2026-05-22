"use client";

import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { updateVendorLogoAction } from "@/app/private/ae-console/platform/vendorActions";
import { resolveVendorImageUrl } from "@/lib/vendors/publicMediaUrl";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function VendorLogoUpload({
  vendorId,
  vendorName,
  logoUrl,
  size = 44,
}: {
  vendorId: string;
  vendorName: string;
  logoUrl: string | null;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const resolved = resolveVendorImageUrl(logoUrl);

  function onFileChange(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("vendorId", vendorId);
    fd.set("logo", file);
    startTransition(() => updateVendorLogoAction(fd));
  }

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "action.hover",
          border: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {pending ? (
          <CircularProgress size={22} />
        ) : resolved ? (
          <Image src={resolved} alt={`${vendorName} logo`} fill style={{ objectFit: "contain" }} sizes={`${size}px`} />
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600 }}>
            Logo
          </Typography>
        )}
      </Box>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            onFileChange(file);
            e.target.value = "";
          }}
        />
        <Button
          size="small"
          variant="text"
          startIcon={<PhotoCameraOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          sx={{ alignSelf: "flex-start", minWidth: 0, px: 0.5, py: 0 }}
        >
          {resolved ? "Replace" : "Upload"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          PNG, JPG, WebP · 5 MB max · optimized on upload
        </Typography>
      </Stack>
    </Stack>
  );
}
