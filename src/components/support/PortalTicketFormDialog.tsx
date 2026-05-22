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
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { createPortalTicketAction, updateTicketAction } from "@/app/(dashboard)/app/support/actions";
import { UsaAddressFields } from "@/components/forms/UsaAddressFields";
import { TICKET_PRIORITIES } from "@/lib/validations/support";
import type { Database } from "@/types/database";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

export type PortalFormDefaults = {
  requester_company_name?: string;
  contact_name?: string;
  phone?: string;
};

const formSchema = z.object({
  requester_company_name: z.string().min(2).max(200),
  contact_name: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  address_line1: z.string().min(1).max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state_code: z.string().min(2).max(2),
  postal_code: z.string().min(5).max(10),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type FormValues = z.infer<typeof formSchema>;

function toDefaults(ticket?: SupportTicketRow | null, prefill?: PortalFormDefaults): FormValues {
  return {
    requester_company_name: ticket?.requester_company_name ?? prefill?.requester_company_name ?? "",
    contact_name: ticket?.contact_name ?? prefill?.contact_name ?? "",
    phone: ticket?.phone ?? prefill?.phone ?? "",
    address_line1: ticket?.address_line1 ?? "",
    address_line2: ticket?.address_line2 ?? undefined,
    city: ticket?.city ?? "",
    state_code: ticket?.state_code ?? "",
    postal_code: ticket?.postal_code ?? "",
    subject: ticket?.subject ?? "",
    body: ticket?.body ?? "",
    priority: ticket?.priority ?? "medium",
  };
}

export function PortalTicketFormDialog({
  open,
  mode,
  ticket,
  formDefaults,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  ticket: SupportTicketRow | null;
  formDefaults?: PortalFormDefaults;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = mode === "edit" && ticket;

  const defaults = useMemo(
    () => toDefaults(isEdit ? ticket : null, formDefaults),
    [isEdit, ticket, formDefaults]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  const stateCode = useWatch({ control, name: "state_code" });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const onSubmit = (values: FormValues) => {
    const fd = new FormData();
    fd.set("requester_company_name", values.requester_company_name);
    fd.set("contact_name", values.contact_name);
    fd.set("phone", values.phone);
    fd.set("address_line1", values.address_line1);
    if (values.address_line2?.trim()) fd.set("address_line2", values.address_line2.trim());
    fd.set("city", values.city);
    fd.set("state_code", values.state_code);
    fd.set("postal_code", values.postal_code);
    fd.set("subject", values.subject);
    fd.set("body", values.body);
    fd.set("priority", values.priority);

    if (isEdit && ticket) {
      fd.set("ticketId", ticket.id);
      fd.set("formMode", "portal");
      startTransition(() => updateTicketAction(fd));
    } else {
      startTransition(() => createPortalTicketAction(fd));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit support request" : "Request support"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Facility / company information
            </Typography>
            <Controller
              name="requester_company_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Company / facility name"
                  required
                  fullWidth
                  error={!!errors.requester_company_name}
                  helperText={errors.requester_company_name?.message}
                />
              )}
            />
            <Controller
              name="contact_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Contact person"
                  required
                  fullWidth
                  error={!!errors.contact_name}
                  helperText={errors.contact_name?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone number"
                  required
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />

            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
              Service location (USA)
            </Typography>
            <UsaAddressFields control={control} errors={errors} stateCode={stateCode ?? ""} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
              Issue details
            </Typography>
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
                  label="Describe the issue"
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  error={!!errors.body}
                  helperText={errors.body?.message}
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel id="portal-priority-label">Priority</InputLabel>
                  <Select labelId="portal-priority-label" label="Priority" {...field}>
                    {TICKET_PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {isEdit ? "Save" : "Submit request"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
