"use client";

import { StatusPill } from "@/components/ui/data-table";
import type { TaskPriority } from "@/types/database";

const LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const TONE: Record<TaskPriority, "neutral" | "info" | "warning" | "error"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "error",
};

export function PriorityChip({ priority, size = "small" }: { priority: TaskPriority; size?: "small" | "medium" }) {
  return <StatusPill label={LABELS[priority]} tone={TONE[priority]} size={size} />;
}
