"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { updateTaskStatusAction } from "@/app/(dashboard)/app/maintenance/actions";
import type { Database, TaskStatus } from "@/types/database";

import { TaskCard } from "./TaskCard";

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

const COLUMN_ORDER: TaskStatus[] = ["open", "in_progress", "done", "cancelled"];

const COLUMN_LABEL: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

function sortWithinColumn(a: MaintenanceTaskRow, b: MaintenanceTaskRow) {
  const rank: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
  const pr = (rank[a.priority] ?? 0) - (rank[b.priority] ?? 0);
  if (pr !== 0) return -pr;
  const ad = a.due_date ?? "";
  const bd = b.due_date ?? "";
  return ad.localeCompare(bd);
}

export function MaintenanceKanban({
  tasks,
  orgMembers,
  onEdit,
}: {
  tasks: MaintenanceTaskRow[];
  orgMembers: OrgMember[];
  onEdit: (task: MaintenanceTaskRow) => void;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, MaintenanceTaskRow[]>();
    for (const s of COLUMN_ORDER) map.set(s, []);
    for (const t of tasks) {
      const list = map.get(t.status);
      if (list) list.push(t);
    }
    for (const s of COLUMN_ORDER) {
      map.get(s)!.sort(sortWithinColumn);
    }
    return map;
  }, [tasks]);

  const onColumnDrop = (status: TaskStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    startTransition(async () => {
      const r = await updateTaskStatusAction(fd);
      if (r.ok) router.refresh();
    });
  };

  const columnBody = (status: TaskStatus) => {
    const list = byStatus.get(status) ?? [];
    return (
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOverStatus(status);
        }}
        onDrop={onColumnDrop(status)}
        sx={{
          minHeight: 120,
          flex: 1,
          p: 1,
          borderRadius: 1,
          bgcolor: dragOverStatus === status ? "action.hover" : "transparent",
          transition: (t) => t.transitions.create("background-color", { duration: 150 }),
          overflowY: "auto",
          maxHeight: mdUp ? "calc(100vh - 220px)" : undefined,
        }}
      >
        {list.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 2, textAlign: "center" }}>
            Drop tasks here
          </Typography>
        ) : (
          list.map((task) => <TaskCard key={task.id} task={task} orgMembers={orgMembers} onEdit={onEdit} draggable={!pending} />)
        )}
      </Box>
    );
  };

  if (tasks.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No tasks yet — create your first one.</Typography>
      </Paper>
    );
  }

  if (!mdUp) {
    return (
      <Stack spacing={1}>
        {COLUMN_ORDER.map((status) => {
          const list = byStatus.get(status) ?? [];
          return (
            <Accordion key={status} defaultExpanded={status === "open"}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontWeight: 700 }}>{COLUMN_LABEL[status]}</Typography>
                  <Chip label={list.length} size="small" />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>{columnBody(status)}</AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1.5} alignItems="stretch" sx={{ overflowX: "auto", pb: 1 }}>
      {COLUMN_ORDER.map((status) => {
        const list = byStatus.get(status) ?? [];
        return (
          <Paper
            key={status}
            variant="outlined"
            sx={{
              flex: "1 1 0",
              minWidth: 260,
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {COLUMN_LABEL[status]}
                </Typography>
                <Chip label={list.length} size="small" />
              </Stack>
            </Box>
            {columnBody(status)}
          </Paper>
        );
      })}
    </Stack>
  );
}
