"use client";

import { Avatar, Box, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";

import type { Database } from "@/types/database";

import { CategoryChip } from "./CategoryChip";
import { PriorityChip } from "./PriorityChip";

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

function memberLabel(m: OrgMember | undefined) {
  if (!m) return "Unassigned";
  return m.full_name?.trim() || m.email;
}

function dueCaption(due: string | null) {
  if (!due) return null;
  return new Date(due + "T12:00:00").toLocaleDateString();
}

export function TaskCard({
  task,
  orgMembers,
  onEdit,
  draggable,
}: {
  task: MaintenanceTaskRow;
  orgMembers: OrgMember[];
  onEdit: (task: MaintenanceTaskRow) => void;
  draggable?: boolean;
}) {
  const assignee = orgMembers.find((m) => m.id === task.assigned_to);
  const category = task.category ?? "other";

  return (
    <Card
      variant="outlined"
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData("text/task-id", task.id);
              e.dataTransfer.effectAllowed = "move";
            }
          : undefined
      }
      sx={{ mb: 1, cursor: draggable ? "grab" : "pointer", "&:active": { cursor: draggable ? "grabbing" : "pointer" } }}
    >
      <CardActionArea onClick={() => onEdit(task)}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack spacing={0.75}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {task.title}
            </Typography>
            {task.pool_label ? (
              <Typography variant="caption" color="text.secondary">
                {task.pool_label}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <PriorityChip priority={task.priority} />
              <CategoryChip category={category} />
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {dueCaption(task.due_date) ? `Due ${dueCaption(task.due_date)}` : "No due date"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: "0.65rem" }}>
                  {memberLabel(assignee).charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 100 }}>
                  {assignee ? memberLabel(assignee).split(" ")[0] : "—"}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
