import { z } from "zod";

import type { TaskCategory, TaskPriority, TaskStatus } from "@/types/database";

export const TASK_STATUSES: TaskStatus[] = ["open", "in_progress", "done", "cancelled"];

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const TASK_CATEGORIES: TaskCategory[] = [
  "chemical",
  "equipment",
  "facility",
  "safety",
  "cleaning",
  "inspection",
  "other",
];

/** Shared by react-hook-form and server actions (no .default / .preprocess — keeps Resolver types stable). */
export const taskSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum([
    "chemical",
    "equipment",
    "facility",
    "safety",
    "cleaning",
    "inspection",
    "other",
  ]),
  pool_id: z.string().uuid().nullable(),
  pool_label: z.string().max(120).optional(),
  assigned_to: z.string().uuid().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const taskStatusOnlySchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]),
});

export const taskIdSchema = z.object({
  id: z.string().uuid(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
