"use client";

import { Chip } from "@mui/material";

import type { TaskCategory } from "@/types/database";

const LABELS: Record<TaskCategory, string> = {
  chemical: "Chemical",
  equipment: "Equipment",
  facility: "Facility",
  safety: "Safety",
  cleaning: "Cleaning",
  inspection: "Inspection",
  other: "Other",
};

export function CategoryChip({ category, size = "small" }: { category: TaskCategory; size?: "small" | "medium" }) {
  return <Chip label={LABELS[category]} size={size} variant="outlined" />;
}
