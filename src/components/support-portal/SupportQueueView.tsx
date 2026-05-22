"use client";

import {
  Alert,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { acceptTicketAction } from "@/app/(support-portal)/portal/actions";
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
import { US_STATES } from "@/lib/geo/usStates";
import type { Database } from "@/types/database";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];

const FLASH: Record<string, { severity: "success" | "error" | "info"; text: string }> = {
  accepted: { severity: "success", text: "Ticket accepted and assigned to your company." },
  error: { severity: "error", text: "Could not accept ticket. It may already be assigned." },
  no_provider: { severity: "info", text: "Your account is not linked to a support provider. Contact your administrator." },
};

function formatAddress(t: Ticket) {
  const parts = [
    t.address_line1,
    t.address_line2,
    [t.city, usStateName(t.state_code), t.postal_code].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

export function SupportQueueView({
  tickets,
  initialState,
  canAccept = true,
}: {
  tickets: Ticket[];
  initialState: string;
  canAccept?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snackOpen, setSnackOpen] = useState(false);
  const [snack, setSnack] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);

  const stateFilter = searchParams.get("state") ?? initialState ?? "";

  const pushState = useCallback(
    (code: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (code) p.set("state", code);
      else p.delete("state");
      p.delete("status");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

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
    <Container maxWidth="lg" disableGutters>
      <Stack spacing={3}>
        {!canAccept ? (
          <Alert severity="warning">
            Your account is not linked to a support provider. You can view the queue but cannot accept tickets until an
            administrator assigns your company.
          </Alert>
        ) : null}

        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Open queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available support requests waiting for a provider. Accept a ticket to assign it to your company.
          </Typography>
        </Stack>

        <FormControl size="small" sx={{ maxWidth: 220 }}>
          <InputLabel id="queue-state-filter">Filter by state</InputLabel>
          <Select
            labelId="queue-state-filter"
            label="Filter by state"
            value={stateFilter}
            onChange={(e) => pushState(e.target.value)}
          >
            <MenuItem value="">All states</MenuItem>
            {US_STATES.map((s) => (
              <MenuItem key={s.code} value={s.code}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DataTable>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Created</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No open tickets in this view. Check back later or adjust the state filter.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <TablePrimaryCell primary={t.subject} secondary={t.contact_name ?? undefined} />
                  </TableCell>
                  <TableCell>{t.requester_company_name ?? "—"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 280 }}>
                      {formatAddress(t)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <PriorityChip priority={t.priority} />
                  </TableCell>
                  <TableCell>
                    <TableDateTimeCell iso={t.created_at} />
                  </TableCell>
                  <TableCell>
                    {canAccept ? (
                      <form action={acceptTicketAction}>
                        <input type="hidden" name="ticketId" value={t.id} />
                        <Button type="submit" variant="contained" size="small">
                          Accept
                        </Button>
                      </form>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${tickets.length} available`} size="small" />
        </Stack>

        <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
          {snack ? (
            <Alert severity={snack.severity} onClose={() => setSnackOpen(false)}>
              {snack.text}
            </Alert>
          ) : undefined}
        </Snackbar>
      </Stack>
    </Container>
  );
}
