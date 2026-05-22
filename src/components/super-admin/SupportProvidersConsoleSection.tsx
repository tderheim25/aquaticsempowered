"use client";

import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { upsertSupportProviderAction } from "@/app/private/ae-console/support/actions";
import { UsaAddressFields } from "@/components/forms/UsaAddressFields";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import { usStateName } from "@/lib/geo/usStates";
import type { Database } from "@/types/database";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { supportProviderSchema } from "@/lib/validations/support";

type Provider = Database["public"]["Tables"]["support_providers"]["Row"];

export type ProviderTechnicianRow = {
  id: string;
  email: string;
  full_name: string | null;
  support_provider_id: string | null;
  created_at: string;
};

export type PendingTechnicianInviteRow = {
  id: string;
  email: string;
  full_name: string | null;
  support_provider_id: string;
  created_at: string;
};

const formSchema = supportProviderSchema;

type FormValues = z.infer<typeof formSchema>;

function toFormValues(p: Provider | null): FormValues {
  return {
    name: p?.name ?? "",
    contact_name: p?.contact_name ?? "",
    phone: p?.phone ?? "",
    address_line1: p?.address_line1 ?? "",
    address_line2: p?.address_line2 ?? undefined,
    city: p?.city ?? "",
    state_code: p?.state_code ?? "",
    postal_code: p?.postal_code ?? "",
    country: "US",
    is_active: p?.is_active ?? true,
  };
}

function groupByProviderId<T extends { support_provider_id: string | null }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item.support_provider_id) continue;
    const list = map.get(item.support_provider_id) ?? [];
    list.push(item);
    map.set(item.support_provider_id, list);
  }
  return map;
}

export function SupportProvidersConsoleSection({
  providers,
  technicians = [],
  pendingInvites = [],
}: {
  providers: Provider[];
  technicians?: ProviderTechnicianRow[];
  pendingInvites?: PendingTechnicianInviteRow[];
}) {
  const [editing, setEditing] = useState<Provider | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activeCount = useMemo(() => providers.filter((p) => p.is_active).length, [providers]);
  const techsByProvider = useMemo(() => groupByProviderId(technicians), [technicians]);
  const pendingByProvider = useMemo(
    () => groupByProviderId(pendingInvites.map((i) => ({ ...i, support_provider_id: i.support_provider_id }))),
    [pendingInvites],
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {activeCount} active provider{activeCount === 1 ? "" : "s"} · technicians must be linked to a provider
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
          Add provider
        </Button>
      </Stack>

      <AeConsolePanel noPadding>
        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Technicians</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No support providers yet. Add a pool service company to assign technicians and tickets.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((p) => {
                const techs = techsByProvider.get(p.id) ?? [];
                const pending = pendingByProvider.get(p.id) ?? [];
                const totalPeople = techs.length + pending.length;
                const isExpanded = expandedIds.has(p.id);

                return (
                  <ProviderRows
                    key={p.id}
                    provider={p}
                    techs={techs}
                    pending={pending}
                    totalPeople={totalPeople}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(p.id)}
                    onEdit={() => setEditing(p)}
                  />
                );
              })
            )}
          </TableBody>
        </DataTable>
      </AeConsolePanel>

      <ProviderFormDialog
        open={creating || Boolean(editing)}
        provider={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function ProviderRows({
  provider,
  techs,
  pending,
  totalPeople,
  isExpanded,
  onToggle,
  onEdit,
}: {
  provider: Provider;
  techs: ProviderTechnicianRow[];
  pending: PendingTechnicianInviteRow[];
  totalPeople: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <TableRow hover sx={{ "& > td": { borderBottom: isExpanded ? 0 : undefined } }}>
        <TableCell sx={{ py: 1 }}>
          <IconButton
            size="small"
            onClick={onToggle}
            aria-label={isExpanded ? "Collapse technicians" : "Expand technicians"}
            disabled={totalPeople === 0}
          >
            {totalPeople === 0 ? (
              <KeyboardArrowRightRoundedIcon fontSize="small" sx={{ opacity: 0.35 }} />
            ) : isExpanded ? (
              <KeyboardArrowDownRoundedIcon fontSize="small" />
            ) : (
              <KeyboardArrowRightRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell>
          <TablePrimaryCell primary={provider.name} secondary={provider.phone ?? undefined} />
        </TableCell>
        <TableCell>{provider.contact_name ?? "—"}</TableCell>
        <TableCell>
          {[provider.city, usStateName(provider.state_code)].filter(Boolean).join(", ")}
        </TableCell>
        <TableCell>
          {totalPeople === 0 ? (
            <Typography variant="body2" color="text.disabled">
              None
            </Typography>
          ) : (
            <Chip
              size="small"
              label={`${techs.length} active${pending.length ? ` · ${pending.length} pending` : ""}`}
              variant="outlined"
              onClick={onToggle}
              sx={{ cursor: totalPeople > 0 ? "pointer" : "default" }}
            />
          )}
        </TableCell>
        <TableCell>
          <StatusPill label={provider.is_active ? "Active" : "Inactive"} tone={provider.is_active ? "success" : "neutral"} />
        </TableCell>
        <TableCell>
          <TableDateTimeCell iso={provider.created_at} />
        </TableCell>
        <TableCell>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: isExpanded ? 1 : 0, borderColor: "divider" }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, pl: { xs: 2, sm: 7 }, pr: 2, bgcolor: "action.hover", borderRadius: 1, mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Technicians for {provider.name}
              </Typography>
              {techs.length === 0 && pending.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No technicians linked yet. Invite one from the Users section.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {techs.map((t) => (
                    <Stack
                      key={t.id}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{
                        py: 1,
                        px: 1.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t.full_name?.trim() || "No name"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {t.email}
                        </Typography>
                      </Box>
                      <StatusPill label="Active" tone="success" dot={false} />
                      <TableDateTimeCell iso={t.created_at} />
                    </Stack>
                  ))}
                  {pending.map((inv) => (
                    <Stack
                      key={inv.id}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{
                        py: 1,
                        px: 1.5,
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        borderStyle: "dashed",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {inv.full_name?.trim() || inv.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {inv.email}
                        </Typography>
                      </Box>
                      <StatusPill label="Invite pending" tone="warning" dot={false} />
                      <TableDateTimeCell iso={inv.created_at} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function ProviderFormDialog({
  open,
  provider,
  onClose,
}: {
  open: boolean;
  provider: Provider | null;
  onClose: () => void;
}) {
  const defaults = useMemo(() => toFormValues(provider), [provider]);
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
    if (provider) fd.set("providerId", provider.id);
    fd.set("name", values.name);
    fd.set("contact_name", values.contact_name);
    fd.set("phone", values.phone);
    fd.set("address_line1", values.address_line1);
    if (values.address_line2?.trim()) fd.set("address_line2", values.address_line2.trim());
    fd.set("city", values.city);
    fd.set("state_code", values.state_code);
    fd.set("postal_code", values.postal_code);
    if (values.is_active) fd.set("is_active", "on");
    upsertSupportProviderAction(fd);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{provider ? "Edit support provider" : "New support provider"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Company name" required fullWidth error={!!errors.name} helperText={errors.name?.message} />
              )}
            />
            <Controller
              name="contact_name"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Primary contact" required fullWidth error={!!errors.contact_name} helperText={errors.contact_name?.message} />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Phone" required fullWidth error={!!errors.phone} helperText={errors.phone?.message} />
              )}
            />
            <UsaAddressFields control={control} errors={errors} stateCode={stateCode ?? ""} />
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value ?? true} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Active (can receive assignments)"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
