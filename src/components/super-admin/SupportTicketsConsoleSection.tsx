"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import {
  assignSupportTicketAction,
  updateSupportTicketStatusAction,
} from "@/app/private/ae-console/support/actions";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import { PriorityChip } from "@/components/maintenance/PriorityChip";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import { usStateName, US_STATES } from "@/lib/geo/usStates";
import type { Database, TicketStatus } from "@/types/database";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

type Provider = { id: string; name: string };
type Technician = { id: string; email: string; full_name: string | null; support_provider_id: string | null };

const ALL = "";
const UNASSIGNED_PROVIDER = "__unassigned__";

export function SupportTicketsConsoleSection({
  tickets,
  providers,
  technicians,
  orgNameById,
}: {
  tickets: Ticket[];
  providers: Provider[];
  technicians: Technician[];
  orgNameById: Map<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [stateFilter, setStateFilter] = useState<string>(ALL);
  const [providerFilter, setProviderFilter] = useState<string>(ALL);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const providerNameById = useMemo(() => new Map(providers.map((p) => [p.id, p.name])), [providers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (stateFilter && t.state_code !== stateFilter) return false;
      if (providerFilter === UNASSIGNED_PROVIDER && t.assigned_support_provider_id) return false;
      if (providerFilter && providerFilter !== UNASSIGNED_PROVIDER && t.assigned_support_provider_id !== providerFilter) {
        return false;
      }
      if (!q) return true;
      const company =
        t.requester_company_name ?? (t.org_id ? orgNameById.get(t.org_id) : "") ?? "";
      const assigned =
        t.assigned_support_provider_id
          ? providerNameById.get(t.assigned_support_provider_id) ?? ""
          : "";
      const haystack = [
        t.subject,
        t.body ?? "",
        company,
        t.contact_name ?? "",
        t.phone ?? "",
        t.source,
        t.status,
        t.priority,
        usStateName(t.state_code),
        t.state_code ?? "",
        assigned,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tickets, query, statusFilter, stateFilter, providerFilter, orgNameById, providerNameById]);

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subject, company, contact, provider…"
          size="small"
          margin="none"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery("")} aria-label="Clear search">
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            maxWidth: { md: 360 },
            "& .MuiOutlinedInput-root": {
              bgcolor: (theme) => theme.palette.action.hover,
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "divider" },
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexGrow: 1, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value={ALL}>All</MenuItem>
              {(["open", "pending", "resolved", "closed"] as TicketStatus[]).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>State</InputLabel>
            <Select label="State" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <MenuItem value={ALL}>All states</MenuItem>
              {US_STATES.map((s) => (
                <MenuItem key={s.code} value={s.code}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Support provider</InputLabel>
            <Select
              label="Support provider"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <MenuItem value={ALL}>All providers</MenuItem>
              <MenuItem value={UNASSIGNED_PROVIDER}>
                <em>Unassigned</em>
              </MenuItem>
              {providers.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ ml: { md: "auto" } }}>
            {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
          </Typography>
        </Box>
      </Stack>

      <AeConsolePanel noPadding>
        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} hover sx={{ cursor: "pointer" }} onClick={() => setSelected(t)}>
                <TableCell>
                  <TablePrimaryCell primary={t.subject} secondary={t.contact_name ?? undefined} />
                </TableCell>
                <TableCell>{t.requester_company_name ?? (t.org_id ? orgNameById.get(t.org_id) : "—")}</TableCell>
                <TableCell>{usStateName(t.state_code) || "—"}</TableCell>
                <TableCell>{t.source}</TableCell>
                <TableCell>
                  {t.assigned_support_provider_id
                    ? providerNameById.get(t.assigned_support_provider_id) ?? "—"
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusPill label={t.status} />
                </TableCell>
                <TableCell>
                  <PriorityChip priority={t.priority} />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); setSelected(t); }}>
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </AeConsolePanel>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
        {selected ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              {selected.subject}
            </Typography>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {selected.body}
              </Typography>

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Requester
                </Typography>
                <Typography variant="body2">
                  {selected.requester_company_name ?? orgNameById.get(selected.org_id ?? "") ?? "—"}
                </Typography>
                <Typography variant="body2">{selected.contact_name ?? "—"} · {selected.phone ?? "—"}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Service address
                </Typography>
                <Typography variant="body2">
                  {[
                    selected.address_line1,
                    selected.address_line2,
                    [selected.city, usStateName(selected.state_code), selected.postal_code].filter(Boolean).join(", "),
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusPill label={selected.status} />
                <PriorityChip priority={selected.priority} />
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(selected.created_at).toLocaleString()}
                </Typography>
              </Stack>

              <Box component="form" action={assignSupportTicketAction}>
                <input type="hidden" name="ticketId" value={selected.id} />
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Assignment
                  </Typography>
                  <TextField
                    name="assigned_support_provider_id"
                    label="Support provider"
                    select
                    size="small"
                    fullWidth
                    defaultValue={selected.assigned_support_provider_id ?? ""}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {providers.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    name="assigned_to"
                    label="Technician (optional)"
                    select
                    size="small"
                    fullWidth
                    defaultValue={selected.assigned_to ?? ""}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {technicians.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.full_name?.trim() || u.email}
                        {u.support_provider_id
                          ? ` · ${providerNameById.get(u.support_provider_id) ?? ""}`
                          : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField name="status" label="Status" select size="small" fullWidth defaultValue={selected.status}>
                    {(["open", "pending", "resolved", "closed"] as TicketStatus[]).map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button type="submit" variant="contained" fullWidth>
                    Save assignment
                  </Button>
                </Stack>
              </Box>

              <Box component="form" action={updateSupportTicketStatusAction}>
                <input type="hidden" name="ticketId" value={selected.id} />
                <input type="hidden" name="status" value={selected.status} />
              </Box>
            </Stack>
          </Box>
        ) : null}
      </Drawer>
    </>
  );
}
