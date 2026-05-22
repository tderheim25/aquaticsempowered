"use client";

import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { updateAssignedTicketStatusAction } from "@/app/(support-portal)/portal/actions";
import { PriorityChip } from "@/components/maintenance/PriorityChip";
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
import type { Database, TicketStatus } from "@/types/database";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

const FLASH: Record<string, { severity: "success" | "error"; text: string }> = {
  accepted: { severity: "success", text: "Ticket accepted." },
  updated: { severity: "success", text: "Status updated." },
  error: { severity: "error", text: "Something went wrong." },
};

function formatAddress(t: Ticket) {
  return [t.address_line1, t.city, usStateName(t.state_code), t.postal_code].filter(Boolean).join(", ");
}

export function SupportAssignmentsView({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) return;
    const msg = FLASH[status];
    if (msg) {
      setSnack(msg);
      setSnackOpen(true);
      const p = new URLSearchParams(searchParams.toString());
      p.delete("status");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [searchParams, pathname, router]);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My assignments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tickets assigned to your support provider company.
        </Typography>
      </Stack>

      <DataTable>
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Accepted</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No assigned tickets yet. Accept requests from the open queue.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <TablePrimaryCell primary={t.subject} secondary={t.body?.slice(0, 80) ?? undefined} />
                </TableCell>
                <TableCell>{t.requester_company_name ?? "—"}</TableCell>
                <TableCell>
                  <Typography variant="body2">{t.contact_name ?? "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.phone ?? ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {formatAddress(t)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <PriorityChip priority={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusPill label={t.status} />
                </TableCell>
                <TableCell>
                  <TableDateTimeCell iso={t.accepted_at ?? t.created_at} />
                </TableCell>
                <TableCell>
                  <form action={updateAssignedTicketStatusAction}>
                    <input type="hidden" name="ticketId" value={t.id} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel id={`st-${t.id}`}>Status</InputLabel>
                        <Select labelId={`st-${t.id}`} label="Status" name="status" defaultValue={t.status} size="small">
                          {(["open", "pending", "resolved", "closed"] as TicketStatus[]).map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button type="submit" size="small" variant="outlined">
                        Save
                      </Button>
                    </Stack>
                  </form>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>

      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnackOpen(false)}>
            {snack.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}
