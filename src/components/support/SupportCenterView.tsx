"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Database, TaskPriority, TicketStatus } from "@/types/database";

import { PriorityChip } from "@/components/maintenance/PriorityChip";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/validations/support";

import { TicketFormDialog } from "./TicketFormDialog";

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

export type SupportFilterState = {
  q: string;
  status: TicketStatus | "";
  priority: TaskPriority | "";
  mine: boolean;
};

const FLASH: Record<string, { severity: "success" | "error" | "info"; text: string }> = {
  created: { severity: "success", text: "Ticket submitted." },
  updated: { severity: "success", text: "Ticket updated." },
  error: { severity: "error", text: "Something went wrong. Please try again." },
  plan: { severity: "info", text: "In-app ticketing is available on Essential plans and above." },
};

function memberLabel(m: OrgMember | undefined) {
  if (!m) return "—";
  return m.full_name?.trim() || m.email;
}

function TicketStatusChip({ status }: { status: TicketStatus }) {
  const color =
    status === "open"
      ? "warning"
      : status === "pending"
        ? "info"
        : status === "resolved"
          ? "success"
          : "default";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function SupportCenterView({
  tickets,
  orgMembers,
  supportEnabled,
  hasMaintenanceView,
  initialFilters,
}: {
  tickets: SupportTicketRow[];
  orgMembers: OrgMember[];
  supportEnabled: boolean;
  hasMaintenanceView: boolean;
  initialFilters: SupportFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicketRow | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);

  const [qInput, setQInput] = useState(initialFilters.q);

  useEffect(() => {
    setQInput(initialFilters.q);
  }, [initialFilters.q]);

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

  const hubCards = useMemo(() => {
    const cards: {
      title: string;
      description: string;
      href: string;
      external?: boolean;
    }[] = [
      {
        title: "Email the team",
        description: "Reach us at hello@aquaticsempowered.com for billing, onboarding, or product questions.",
        href: "mailto:hello@aquaticsempowered.com",
        external: true,
      },
      {
        title: "Plans & pricing",
        description: "Compare tiers and unlock ticketing, logs, and maintenance workflows.",
        href: "/pricing",
      },
      {
        title: "Dashboard",
        description: "Return to your home view, admin tools, and organization summary.",
        href: "/app",
      },
    ];
    if (hasMaintenanceView) {
      cards.splice(2, 0, {
        title: "Maintenance",
        description: "Track facility work orders, inspections, and assignments in one place.",
        href: "/app/maintenance",
      });
    }
    return cards;
  }, [hasMaintenanceView]);

  const openCreate = () => {
    setEditingTicket(null);
    setDialogOpen(true);
  };

  const openEdit = (ticket: SupportTicketRow) => {
    setEditingTicket(ticket);
    setDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Support Center
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Help & resources
            </Typography>
            <Grid container spacing={1.5}>
              {hubCards.map((area) => (
                <Grid key={area.title} size={{ xs: 12, sm: 6, md: hasMaintenanceView ? 3 : 4 }}>
                  <Card variant="outlined" sx={{ height: 140 }}>
                    <CardActionArea
                      component={Link}
                      href={area.href}
                      target={area.external ? "_blank" : undefined}
                      rel={area.external ? "noopener noreferrer" : undefined}
                      sx={{ height: "100%" }}
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
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {!supportEnabled ? (
          <Alert severity="info">
            Your current plan does not include in-app support tickets. Upgrade to Essential or higher to submit and track
            requests from your organization.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tickets
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New ticket
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
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
                label="My tickets only"
              />
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Created by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No tickets match your filters. Open a new ticket to reach the Aquatics Empowered team.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow
                        key={t.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => openEdit(t)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{t.subject}</TableCell>
                        <TableCell>
                          <TicketStatusChip status={t.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityChip priority={t.priority} />
                        </TableCell>
                        <TableCell>{formatDate(t.created_at)}</TableCell>
                        <TableCell>{memberLabel(orgMembers.find((u) => u.id === t.created_by))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {supportEnabled ? (
          <TicketFormDialog
            open={dialogOpen}
            mode={editingTicket ? "edit" : "create"}
            ticket={editingTicket}
            onClose={() => {
              setDialogOpen(false);
              setEditingTicket(null);
            }}
          />
        ) : null}

        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
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
