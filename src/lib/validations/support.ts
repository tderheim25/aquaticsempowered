import { z } from "zod";

import type { TaskPriority, TicketStatus } from "@/types/database";

export const TICKET_STATUSES: TicketStatus[] = ["open", "pending", "resolved", "closed"];

export const TICKET_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const ticketCreateSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(200),
  body: z.string().max(10000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const ticketUpdateSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(200),
  body: z.string().max(10000).optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const ticketIdSchema = z.object({
  id: z.string().uuid(),
});

export type TicketCreateValues = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateValues = z.infer<typeof ticketUpdateSchema>;
