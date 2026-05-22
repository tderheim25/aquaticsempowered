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
import { z } from "zod";

import { createPortalTicketAction, updateTicketAction } from "@/app/(dashboard)/app/support/actions";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/validations/support";
import type { Database } from "@/types/database";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

const createFormSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().max(10000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

const editFormSchema = createFormSchema.extend({
  status: z.enum(["open", "pending", "resolved", "closed"]),
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

function toCreateDefaults(): CreateFormValues {
  return { subject: "", body: undefined, priority: "medium" };
}

function toEditValues(ticket: SupportTicketRow): EditFormValues {
  return {
    subject: ticket.subject,
    body: ticket.body ?? undefined,
    status: ticket.status,
    priority: ticket.priority,
  };
}

export function TicketFormDialog({
  open,
  mode,
  ticket,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  ticket: SupportTicketRow | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const isEdit = mode === "edit" && ticket;
  const defaults = useMemo(
    () => (isEdit ? toEditValues(ticket) : toCreateDefaults()),
    [isEdit, ticket]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const onSubmit = (values: CreateFormValues | EditFormValues) => {
    const fd = new FormData();
    fd.set("subject", values.subject);
    if (values.body?.trim()) fd.set("body", values.body.trim());
    else fd.set("body", "");
    fd.set("priority", values.priority);
    if (isEdit && ticket) {
      fd.set("ticketId", ticket.id);
      fd.set("status", (values as EditFormValues).status);
      startTransition(() => updateTicketAction(fd));
    } else {
      startTransition(() => createPortalTicketAction(fd));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit ticket" : "New support ticket"}</DialogTitle>
      <form
        onSubmit={handleSubmit((v) => {
          onSubmit(v);
        })}
      >
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Subject"
                  required
                  fullWidth
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                />
              )}
            />
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  minRows={4}
                  error={!!(errors as Partial<Record<keyof CreateFormValues, { message?: string }>>).body}
                  helperText={
                    (errors as Partial<Record<keyof CreateFormValues, { message?: string }>>).body?.message
                  }
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel id="ticket-priority-label">Priority</InputLabel>
                  <Select labelId="ticket-priority-label" label="Priority" {...field}>
                    {TICKET_PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            {isEdit ? (
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!(errors as Partial<Record<"status", { message?: string }>>).status}>
                    <InputLabel id="ticket-status-label">Status</InputLabel>
                    <Select labelId="ticket-status-label" label="Status" {...field}>
                      {TICKET_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {isEdit ? "Save" : "Submit ticket"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
