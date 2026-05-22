"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Database, TaskPriority, TicketStatus } from "@/types/database";

import { PriorityChip } from "@/components/maintenance/PriorityChip";
import { usStateName } from "@/lib/geo/usStates";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/validations/support";

import { PortalTicketFormDialog, type PortalFormDefaults } from "./PortalTicketFormDialog";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

export type SupportFilterState = {
  q: string;
  status: TicketStatus | "";
  priority: TaskPriority | "";
  mine: boolean;
};

const FLASH: Record<string, { severity: "success" | "error" | "info"; text: string }> = {
  created: { severity: "success", text: "Support request submitted." },
  updated: { severity: "success", text: "Request updated." },
  error: { severity: "error", text: "Something went wrong. Please try again." },
};

function TicketStatusChip({ status }: { status: TicketStatus }) {
  const tone =
    status === "open" ? "warning" : status === "pending" ? "info" : status === "resolved" ? "success" : "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <StatusPill label={label} tone={tone} />;
}

function formatLocation(t: SupportTicketRow) {
  if (!t.city && !t.state_code) return "—";
  const state = usStateName(t.state_code);
  return [t.city, state].filter(Boolean).join(", ");
}

export function SupportCenterView({
  tickets,
  orgMembers: _orgMembers,
  canSeeOrgTickets,
  hasMaintenanceView,
  formDefaults,
  initialFilters,
}: {
  tickets: SupportTicketRow[];
  orgMembers: { id: string; full_name: string | null; email: string }[];
  canSeeOrgTickets: boolean;
  hasMaintenanceView: boolean;
  formDefaults: PortalFormDefaults;
  initialFilters: SupportFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicketRow | null>(null);
  const openedNewTicketFromQuery = useRef(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);

  const [qInput, setQInput] = useState(initialFilters.q);

  useEffect(() => {
    setQInput(initialFilters.q);
  }, [initialFilters.q]);

  useEffect(() => {
    if (searchParams.get("new") !== "1") {
      openedNewTicketFromQuery.current = false;
      return;
    }
    if (openedNewTicketFromQuery.current) return;
    openedNewTicketFromQuery.current = true;

    const p = new URLSearchParams(searchParams.toString());
    p.delete("new");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);

    setEditingTicket(null);
    setDialogOpen(true);
  }, [pathname, router, searchParams]);

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

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput === initialFilters.q) return;
      pushParams((p) => {
        if (qInput.trim()) p.set("q", qInput.trim());
        else p.delete("q");
      });
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, initialFilters.q, pushParams]);

  const openNewRequest = useCallback(() => {
    setEditingTicket(null);
    setDialogOpen(true);
  }, []);

  const hubCards = useMemo(() => {
    const cards: (
      | { title: string; description: string; href: string; external?: boolean }
      | { title: string; description: string; action: "chat" }
    )[] = [
      {
        title: "Email the team",
        description: "Reach us at hello@aquaticsempowered.com for billing, onboarding, or product questions.",
        href: "mailto:hello@aquaticsempowered.com",
        external: true,
      },
      {
        title: "Chat with support agent",
        description: "Start a support request and our team will follow up on your issue.",
        action: "chat",
      },
    ];
    if (hasMaintenanceView) {
      cards.push({
        title: "Maintenance",
        description: "Track facility work orders, inspections, and assignments in one place.",
        href: "/app/maintenance",
      });
    }
    return cards;
  }, [hasMaintenanceView]);

  const listTitle = canSeeOrgTickets && !initialFilters.mine ? "Support requests" : "My support requests";

  return (
    <Container maxWidth="lg" disableGutters>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Support Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit a help request with your facility contact and service address. Org admins and managers can see all
            requests for their organization; other members see their own submissions.
          </Typography>
        </Stack>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {listTitle}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNewRequest}>
                  New support request
                </Button>
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
                flexWrap="wrap"
                useFlexGap
              >
                <TextField
                  size="small"
                  label="Search subject"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 200 } }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="sup-flt-status">Status</InputLabel>
                  <Select
                    labelId="sup-flt-status"
                    label="Status"
                    value={initialFilters.status}
                    onChange={(e) => {
                      const v = e.target.value as TicketStatus | "";
                      pushParams((p) => {
                        if (v) p.set("status", v);
                        else p.delete("status");
                      });
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {TICKET_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="sup-flt-priority">Priority</InputLabel>
                  <Select
                    labelId="sup-flt-priority"
                    label="Priority"
                    value={initialFilters.priority}
                    onChange={(e) => {
                      const v = e.target.value as TaskPriority | "";
                      pushParams((p) => {
                        if (v) p.set("priority", v);
                        else p.delete("priority");
                      });
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {TICKET_PRIORITIES.map((pr) => (
                      <MenuItem key={pr} value={pr}>
                        {pr.charAt(0).toUpperCase() + pr.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {canSeeOrgTickets ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={initialFilters.mine}
                        onChange={(_, checked) => {
                          pushParams((p) => {
                            if (checked) p.set("mine", "1");
                            else p.delete("mine");
                          });
                        }}
                      />
                    }
                    label="Only my requests"
                  />
                ) : null}
              </Stack>

              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No support requests yet. Use <strong>New support request</strong> to get help from our team.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          setEditingTicket(t);
                          setDialogOpen(true);
                        }}
                      >
                        <TableCell>
                          <TablePrimaryCell primary={t.subject} secondary={t.contact_name ?? undefined} />
                        </TableCell>
                        <TableCell>{t.requester_company_name ?? "—"}</TableCell>
                        <TableCell>{formatLocation(t)}</TableCell>
                        <TableCell>
                          <TicketStatusChip status={t.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityChip priority={t.priority} />
                        </TableCell>
                        <TableCell>
                          <TableDateTimeCell iso={t.created_at} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </DataTable>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Help & resources
                </Typography>
                <Stack spacing={1.5}>
                  {hubCards.map((area) => (
                    <Card key={area.title} variant="outlined">
                      {"action" in area ? (
                        <CardActionArea onClick={openNewRequest}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {area.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {area.description}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      ) : (
                        <CardActionArea
                          component={Link}
                          href={area.href}
                          target={area.external ? "_blank" : undefined}
                          rel={area.external ? "noopener noreferrer" : undefined}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {area.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {area.description}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      )}
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <PortalTicketFormDialog
          open={dialogOpen}
          mode={editingTicket ? "edit" : "create"}
          ticket={editingTicket}
          formDefaults={formDefaults}
          onClose={() => {
            setDialogOpen(false);
            setEditingTicket(null);
          }}
        />

        <Snackbar
          open={snackOpen}
          autoHideDuration={6000}
          onClose={() => setSnackOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {snack ? (
            <Alert severity={snack.severity} onClose={() => setSnackOpen(false)} sx={{ width: "100%" }}>
              {snack.text}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Stack>
    </Container>
  );
}
