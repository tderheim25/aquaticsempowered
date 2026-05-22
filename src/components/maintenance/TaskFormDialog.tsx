"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { createTaskAction, updateTaskAction } from "@/app/(dashboard)/app/maintenance/actions";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, taskSchema, type TaskFormValues } from "@/lib/validations/maintenance";
import type { Database } from "@/types/database";

type MaintenanceTaskRow = Database["public"]["Tables"]["maintenance_tasks"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };
type PoolOption = { id: string; name: string };

function memberLabel(m: OrgMember) {
  return m.full_name?.trim() || m.email;
}

function toFormValues(task: MaintenanceTaskRow | null): TaskFormValues {
  if (!task) {
    return {
      title: "",
      description: undefined,
      status: "open",
      priority: "medium",
      category: "other",
      pool_id: null,
      pool_label: undefined,
      assigned_to: null,
      due_date: null,
    };
  }
  return {
    title: task.title,
    description: task.description ?? undefined,
    status: task.status,
    priority: task.priority,
    category: task.category ?? "other",
    pool_id: task.pool_id,
    pool_label: task.pool_label ?? undefined,
    assigned_to: task.assigned_to,
    due_date: task.due_date,
  };
}

export function TaskFormDialog({
  open,
  mode,
  task,
  orgMembers,
  pools,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  task: MaintenanceTaskRow | null;
  orgMembers: OrgMember[];
  pools: PoolOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(() => toFormValues(mode === "edit" ? task : null), [mode, task]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset(toFormValues(mode === "edit" ? task : null));
    }
  }, [open, mode, task, reset]);

  const onSubmit = (values: TaskFormValues) => {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("description", values.description ?? "");
    fd.set("status", values.status);
    fd.set("priority", values.priority);
    fd.set("category", values.category);
    fd.set("pool_id", values.pool_id ?? "");
    fd.set("assigned_to", values.assigned_to ?? "");
    fd.set("due_date", values.due_date ?? "");
    if (mode === "edit" && task) {
      fd.set("taskId", task.id);
    }
    startTransition(() => {
      void (mode === "create" ? createTaskAction(fd) : updateTaskAction(fd));
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="task-dialog-title">
      <DialogTitle id="task-dialog-title">{mode === "create" ? "New maintenance task" : "Edit task"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Title" required fullWidth error={Boolean(errors.title)} helperText={errors.title?.message} />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" fullWidth multiline minRows={3} error={Boolean(errors.description)} helperText={errors.description?.message} />
              )}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel id="task-status-label">Status</InputLabel>
                    <Select {...field} labelId="task-status-label" label="Status">
                      {TASK_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel id="task-priority-label">Priority</InputLabel>
                    <Select {...field} labelId="task-priority-label" label="Priority">
                      {TASK_PRIORITIES.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel id="task-category-label">Category</InputLabel>
                  <Select {...field} labelId="task-category-label" label="Category">
                    {TASK_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="pool_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel id="task-pool-label">Pool (optional)</InputLabel>
                  <Select
                    value={field.value ?? ""}
                    labelId="task-pool-label"
                    label="Pool (optional)"
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {pools.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="assigned_to"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel id="task-assignee-label">Assignee</InputLabel>
                  <Select
                    {...field}
                    value={field.value ?? ""}
                    labelId="task-assignee-label"
                    label="Assignee"
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {orgMembers.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {memberLabel(m)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label="Due date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
