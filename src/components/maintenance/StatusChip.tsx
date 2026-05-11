"use client";

import { Chip } from "@mui/material";

import type { TaskStatus } from "@/types/database";

const LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export function StatusChip({ status, size = "small" }: { status: TaskStatus; size?: "small" | "medium" }) {
  const color =
    status === "done" ? "success" : status === "in_progress" ? "info" : status === "cancelled" ? "default" : "default";
  return <Chip label={LABELS[status]} color={color} size={size} variant={status === "open" ? "outlined" : "filled"} />;
}
