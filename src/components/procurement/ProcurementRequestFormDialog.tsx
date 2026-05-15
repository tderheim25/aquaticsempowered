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

import {
  createProcurementRequestAction,
  updateProcurementRequestAction,
} from "@/app/(dashboard)/app/procurement/actions";
import { PROCUREMENT_CATEGORIES, PROCUREMENT_STATUSES } from "@/lib/validations/procurement";
import type { Database, ProcurementRequestCategory, ProcurementRequestStatus } from "@/types/database";

type ProcurementRequestRow = Database["public"]["Tables"]["procurement_requests"]["Row"];

type VendorOption = { id: string; name: string };

function labelCategory(c: ProcurementRequestCategory) {
  const map: Record<ProcurementRequestCategory, string> = {
    chemicals: "Chemicals & water treatment",
    equipment: "Equipment",
    parts: "Parts & consumables",
    services: "Services",
    other: "Other",
  };
  return map[c];
}

function labelStatus(s: ProcurementRequestStatus) {
  return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const createFormSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(10000).optional(),
  category: z.enum(PROCUREMENT_CATEGORIES),
  preferred_vendor_id: z.string().optional(),
});

const editFormSchema = createFormSchema.extend({
  status: z.enum(PROCUREMENT_STATUSES),
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

function toCreateDefaults(): CreateFormValues {
  return { title: "", description: undefined, category: "other", preferred_vendor_id: "" };
}

function toEditValues(row: ProcurementRequestRow): EditFormValues {
  return {
    title: row.title,
    description: row.description ?? undefined,
    category: row.category,
    preferred_vendor_id: row.preferred_vendor_id ?? "",
    status: row.status,
  };
}

export function ProcurementRequestFormDialog({
  open,
  mode,
  request,
  vendors,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  request: ProcurementRequestRow | null;
  vendors: VendorOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const isEdit = mode === "edit" && request;
  const defaults = useMemo(
    () => (isEdit ? toEditValues(request) : toCreateDefaults()),
    [isEdit, request]
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
    fd.set("title", values.title);
    if (values.description?.trim()) fd.set("description", values.description.trim());
    else fd.set("description", "");
    fd.set("category", values.category);
    fd.set("preferred_vendor_id", values.preferred_vendor_id?.trim() ?? "");
    if (isEdit && request) {
      fd.set("requestId", request.id);
      fd.set("status", (values as EditFormValues).status);
      startTransition(() => updateProcurementRequestAction(fd));
    } else {
      startTransition(() => createProcurementRequestAction(fd));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit requisition" : "New procurement request"}</DialogTitle>
      <form onSubmit={handleSubmit((v) => onSubmit(v))}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  required
                  fullWidth
                  placeholder="e.g. Annual chlorine contract"
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Details"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Quantities, delivery window, specs…"
                  error={!!(errors as Partial<Record<keyof CreateFormValues, { message?: string }>>).description}
                  helperText={
                    (errors as Partial<Record<keyof CreateFormValues, { message?: string }>>).description?.message
                  }
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel id="proc-cat-label">Category</InputLabel>
                  <Select labelId="proc-cat-label" label="Category" {...field}>
                    {PROCUREMENT_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>
                        {labelCategory(c)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="preferred_vendor_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="proc-vendor-label">Preferred vendor (optional)</InputLabel>
                  <Select
                    labelId="proc-vendor-label"
                    label="Preferred vendor (optional)"
                    {...field}
                    value={field.value || ""}
                  >
                    <MenuItem value="">
                      <em>No preference</em>
                    </MenuItem>
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.name}
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
                    <InputLabel id="proc-status-label">Status</InputLabel>
                    <Select labelId="proc-status-label" label="Status" {...field}>
                      {PROCUREMENT_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {labelStatus(s)}
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
            {isEdit ? "Save" : "Submit request"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
