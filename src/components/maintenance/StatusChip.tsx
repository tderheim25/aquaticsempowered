"use client";

import { StatusPill } from "@/components/ui/data-table";
import type { TaskStatus } from "@/types/database";

const LABELS: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

const TONE: Record<TaskStatus, "warning" | "info" | "success" | "neutral"> = {
  open: "warning",
  in_progress: "info",
  done: "success",
  cancelled: "neutral",
};

export function StatusChip({ status, size = "small" }: { status: TaskStatus; size?: "small" | "medium" }) {
  return <StatusPill label={LABELS[status]} tone={TONE[status]} size={size} />;
}
