"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

export type CommunityPostImageItem = {
  id: string;
  src: string;
  alt?: string;
};

export function CommunityPostImages({
  images,
  layout = "feed",
}: {
  images: CommunityPostImageItem[];
  /** `feed` = post thumbnails; `gallery` = square profile photo grid */
  layout?: "feed" | "gallery";
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [index, setIndex] = useState<number | null>(null);

  const open = index !== null;
  const current = index !== null ? images[index] : null;
  const hasMultiple = images.length > 1;

  const close = useCallback(() => setIndex(null), []);
  const goPrev = useCallback(() => {
    setIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, goPrev, goNext]);

  if (images.length === 0) return null;

  const isSingleFeedImage = layout === "feed" && images.length === 1;

  return (
    <>
      <Box
        sx={{
          mt: layout === "feed" ? 1.5 : 0,
          display: "grid",
          gridTemplateColumns:
            layout === "gallery"
              ? "repeat(auto-fill, minmax(120px, 1fr))"
              : images.length === 1
                ? "minmax(0, 1fr)"
                : { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(auto-fill, minmax(140px, 1fr))" },
          gap: layout === "gallery" ? 1.25 : 1,
          width: "100%",
          maxWidth: isSingleFeedImage ? "50%" : undefined,
          minWidth: 0,
        }}
      >
        {images.map((img, i) => (
          <Box
            key={img.id}
            component="button"
            type="button"
            aria-label="View full size image"
            onClick={() => setIndex(i)}
            sx={{
              display: "block",
              width: "100%",
              p: 0,
              m: 0,
              border: "none",
              borderRadius: 1,
              overflow: "hidden",
              cursor: "zoom-in",
              bgcolor: "transparent",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            <Box
              component="img"
              src={img.src}
              alt={img.alt ?? "Post image"}
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: layout === "gallery" ? "auto" : "auto",
                aspectRatio: layout === "gallery" ? "1" : undefined,
                maxHeight: layout === "gallery" ? undefined : { xs: 280, sm: 320 },
                borderRadius: layout === "gallery" ? 2 : 1,
                objectFit: layout === "gallery" || !isSingleFeedImage ? "cover" : "contain",
                display: "block",
                verticalAlign: "middle",
                border: layout === "gallery" ? "1px solid" : "none",
                borderColor: layout === "gallery" ? "divider" : undefined,
                boxShadow:
                  layout === "gallery" ? "0 4px 16px -10px rgba(15, 23, 42, 0.12)" : "none",
              }}
            />
          </Box>
        ))}
      </Box>

      <Dialog
        open={open}
        onClose={close}
        fullScreen={fullScreen}
        maxWidth={false}
        aria-label="Image preview"
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(0, 0, 0, 0.92)" } },
        }}
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
            m: fullScreen ? 0 : 2,
            maxWidth: fullScreen ? "100%" : "min(96vw, 1200px)",
            maxHeight: fullScreen ? "100%" : "96vh",
            width: fullScreen ? "100%" : "auto",
            height: fullScreen ? "100%" : "auto",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: fullScreen ? "100%" : "96vh",
            minHeight: fullScreen ? "100dvh" : 320,
            p: { xs: 1, sm: 2 },
          }}
          onClick={close}
        >
          <IconButton
            aria-label="Close image"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            sx={{
              position: "absolute",
              top: { xs: 8, sm: 12 },
              right: { xs: 8, sm: 12 },
              zIndex: 2,
              color: "common.white",
              bgcolor: "rgba(0,0,0,0.45)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          {hasMultiple && index !== null ? (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: { xs: 14, sm: 18 },
                left: "50%",
                transform: "translateX(-50%)",
                color: "common.white",
                bgcolor: "rgba(0,0,0,0.45)",
                px: 1.25,
                py: 0.25,
                borderRadius: 1,
                zIndex: 2,
              }}
            >
              {index + 1} / {images.length}
            </Typography>
          ) : null}

          {hasMultiple && index !== null && index > 0 ? (
            <IconButton
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              sx={{
                position: "absolute",
                left: { xs: 4, sm: 12 },
                zIndex: 2,
                color: "common.white",
                bgcolor: "rgba(0,0,0,0.45)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
              }}
            >
              <ChevronLeftRoundedIcon fontSize="large" />
            </IconButton>
          ) : null}

          {hasMultiple && index !== null && index < images.length - 1 ? (
            <IconButton
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              sx={{
                position: "absolute",
                right: { xs: 4, sm: 12 },
                zIndex: 2,
                color: "common.white",
                bgcolor: "rgba(0,0,0,0.45)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
              }}
            >
              <ChevronRightRoundedIcon fontSize="large" />
            </IconButton>
          ) : null}

          {current ? (
            <Box
              component="img"
              src={current.src}
              alt={current.alt ?? "Post image"}
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: "100%",
                maxHeight: fullScreen ? "calc(100dvh - 32px)" : "calc(96vh - 48px)",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: 1,
                userSelect: "none",
              }}
            />
          ) : null}
        </Box>
      </Dialog>
    </>
  );
}
