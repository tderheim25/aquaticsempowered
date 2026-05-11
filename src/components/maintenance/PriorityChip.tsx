"use client";

import { Chip } from "@mui/material";

import type { TaskPriority } from "@/types/database";

const LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function PriorityChip({ priority, size = "small" }: { priority: TaskPriority; size?: "small" | "medium" }) {
  const color =
    priority === "urgent" ? "error" : priority === "high" ? "warning" : priority === "medium" ? "info" : "default";
  return <Chip label={LABELS[priority]} color={color} size={size} variant="outlined" />;
}
