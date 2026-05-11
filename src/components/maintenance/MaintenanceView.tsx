"use client";

import { Add as AddIcon } from "@mui/icons-material";
import { Alert, Box, Button, Container, Snackbar, Stack, Tab, Tabs, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Database } from "@/types/database";

import { MaintenanceFilters, type MaintenanceFilterState } from "./MaintenanceFilters";
import { MaintenanceKanban } from "./MaintenanceKanban";
import { MaintenanceList } from "./MaintenanceList";
import { TaskFormDialog } from "./TaskFormDialog";

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

const FLASH: Record<string, { severity: "success" | "error"; text: string }> = {
  created: { severity: "success", text: "Task created." },
  updated: { severity: "success", text: "Task updated." },
  deleted: { severity: "success", text: "Task deleted." },
  error: { severity: "error", text: "Something went wrong. Please try again." },
};

export function MaintenanceView({
  tasks,
  orgMembers,
  initialView,
  initialFilters,
}: {
  tasks: MaintenanceTaskRow[];
  orgMembers: OrgMember[];
  initialView: "list" | "kanban";
  initialFilters: MaintenanceFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"list" | "kanban">(initialView);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<MaintenanceTaskRow | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setTab(initialView);
  }, [initialView]);

  const stripFlash = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.has("status")) return;
    p.delete("status");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) return;
    const msg = FLASH[status];
    if (msg) {
      setSnack(msg);
      setSnackOpen(true);
    }
    stripFlash();
  }, [searchParams, stripFlash]);

  const setViewParam = (next: "list" | "kanban") => {
    const p = new URLSearchParams(searchParams.toString());
    if (next === "list") p.delete("view");
    else p.set("view", "kanban");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const openCreate = () => {
    setDialogMode("create");
    setEditingTask(null);
    setDialogOpen(true);
  };

  const openEdit = (task: MaintenanceTaskRow) => {
    setDialogMode("edit");
    setEditingTask(task);
    setDialogOpen(true);
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Maintenance
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add task
          </Button>
        </Stack>

        <MaintenanceFilters orgMembers={orgMembers} initial={initialFilters} />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              const next = v as "list" | "kanban";
              setTab(next);
              setViewParam(next);
            }}
          >
            <Tab label="List" value="list" />
            <Tab label="Kanban" value="kanban" />
          </Tabs>
        </Box>

        {tab === "list" ? (
          <MaintenanceList tasks={tasks} orgMembers={orgMembers} onEdit={openEdit} />
        ) : (
          <MaintenanceKanban tasks={tasks} orgMembers={orgMembers} onEdit={openEdit} />
        )}

        <TaskFormDialog
          open={dialogOpen}
          mode={dialogMode}
          task={dialogMode === "edit" ? editingTask : null}
          orgMembers={orgMembers}
          onClose={() => setDialogOpen(false)}
        />

        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          {snack ? <Alert severity={snack.severity} onClose={() => setSnackOpen(false)} sx={{ width: "100%" }}>{snack.text}</Alert> : undefined}
        </Snackbar>
      </Stack>
    </Container>
  );
}
