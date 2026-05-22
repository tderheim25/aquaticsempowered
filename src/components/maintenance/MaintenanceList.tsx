"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";

import {
  DataTable,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
  TableSortLabel,
} from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { deleteTaskAction, updateTaskStatusAction } from "@/app/(dashboard)/app/maintenance/actions";
import type { Database } from "@/types/database";

import { CategoryChip } from "./CategoryChip";
import { PriorityChip } from "./PriorityChip";
import { StatusChip } from "./StatusChip";

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

function memberLabel(m: OrgMember | undefined) {
  if (!m) return "—";
  return m.full_name?.trim() || m.email;
}

type OrderKey = "title" | "status" | "priority" | "category" | "assignee" | "due_date" | "updated_at";

function dueDateTone(due: string | null): "error" | "warning" | undefined {
  if (!due) return undefined;
  const dueDay = new Date(due + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDay.setHours(0, 0, 0, 0);
  const diff = (dueDay.getTime() - today.getTime()) / 86400000;
  if (diff < 0) return "error";
  if (diff <= 3) return "warning";
  return undefined;
}

export function MaintenanceList({
  tasks,
  orgMembers,
  onEdit,
}: {
  tasks: MaintenanceTaskRow[];
  orgMembers: OrgMember[];
  onEdit: (task: MaintenanceTaskRow) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [orderBy, setOrderBy] = useState<OrderKey>("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const list = [...tasks];
    const dir = order === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const assigneeName = (id: string | null) => {
        const m = orgMembers.find((x) => x.id === id);
        return memberLabel(m).toLowerCase();
      };
      switch (orderBy) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "priority": {
          const rank: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
          return ((rank[a.priority] ?? 0) - (rank[b.priority] ?? 0)) * dir;
        }
        case "category":
          return (a.category ?? "other").localeCompare(b.category ?? "other") * dir;
        case "assignee":
          return assigneeName(a.assigned_to).localeCompare(assigneeName(b.assigned_to)) * dir;
        case "due_date": {
          const ad = a.due_date ?? "";
          const bd = b.due_date ?? "";
          return ad.localeCompare(bd) * dir;
        }
        case "updated_at":
        default:
          return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
      }
    });
    return list;
  }, [tasks, orderBy, order, orgMembers]);

  const handleSort = (key: OrderKey) => {
    if (orderBy === key) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(key);
      setOrder(key === "title" || key === "assignee" ? "asc" : "desc");
    }
  };

  const markDone = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", "done");
    startTransition(async () => {
      const r = await updateTaskStatusAction(fd);
      if (r.ok) router.refresh();
    });
  };

  const remove = (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      void deleteTaskAction(fd);
    });
  };

  if (tasks.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No tasks yet — create your first one.</Typography>
      </Paper>
    );
  }

  return (
    <>
      <DataTable>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={orderBy === "title" ? order : false}>
                <TableSortLabel active={orderBy === "title"} direction={orderBy === "title" ? order : "asc"} onClick={() => handleSort("title")}>
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "status" ? order : false}>
                <TableSortLabel active={orderBy === "status"} direction={orderBy === "status" ? order : "asc"} onClick={() => handleSort("status")}>
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "priority" ? order : false}>
                <TableSortLabel active={orderBy === "priority"} direction={orderBy === "priority" ? order : "asc"} onClick={() => handleSort("priority")}>
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "category" ? order : false}>
                <TableSortLabel active={orderBy === "category"} direction={orderBy === "category" ? order : "asc"} onClick={() => handleSort("category")}>
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "assignee" ? order : false}>
                <TableSortLabel active={orderBy === "assignee"} direction={orderBy === "assignee" ? order : "asc"} onClick={() => handleSort("assignee")}>
                  Assignee
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "due_date" ? order : false}>
                <TableSortLabel active={orderBy === "due_date"} direction={orderBy === "due_date" ? order : "asc"} onClick={() => handleSort("due_date")}>
                  Due
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={orderBy === "updated_at" ? order : false}>
                <TableSortLabel active={orderBy === "updated_at"} direction={orderBy === "updated_at" ? order : "asc"} onClick={() => handleSort("updated_at")}>
                  Updated
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((task) => {
              const assignee = orgMembers.find((m) => m.id === task.assigned_to);
              const tone = dueDateTone(task.due_date);
              const category = task.category ?? "other";
              return (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <TablePrimaryCell primary={task.title} secondary={task.pool_label ?? undefined} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={task.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={task.priority} />
                  </TableCell>
                  <TableCell>
                    <CategoryChip category={category} />
                  </TableCell>
                  <TableCell>{memberLabel(assignee)}</TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <Typography variant="body2" color={tone === "error" ? "error" : tone === "warning" ? "warning.main" : "text.primary"}>
                        {new Date(task.due_date + "T12:00:00").toLocaleDateString()}
                      </Typography>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <TableDateTimeCell iso={task.updated_at} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.25 }}>
                      {task.status !== "done" ? (
                        <Tooltip title="Mark done">
                          <span>
                            <IconButton size="small" onClick={() => markDone(task.id)} disabled={pending} aria-label="Mark done">
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(task)} aria-label="Edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(task.id)} aria-label="Delete">
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
      </DataTable>

      {confirmDeleteId ? (
        <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Delete this task? This cannot be undone.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button size="small" color="error" variant="contained" onClick={() => remove(confirmDeleteId)} disabled={pending}>
              Delete
            </Button>
          </Box>
        </Paper>
      ) : null}
    </>
  );
}
