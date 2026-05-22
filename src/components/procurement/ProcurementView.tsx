"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
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
import { useCallback, useEffect, useState } from "react";

import { PROCUREMENT_CATEGORIES, PROCUREMENT_STATUSES } from "@/lib/validations/procurement";
import type { Database, ProcurementRequestCategory, ProcurementRequestStatus } from "@/types/database";

import { ProcurementRequestFormDialog } from "./ProcurementRequestFormDialog";

type ProcurementRequestRow = Database["public"]["Tables"]["procurement_requests"]["Row"];

type OrgMember = { id: string; full_name: string | null; email: string };

type VendorOption = { id: string; name: string };

export type ProcurementFilterState = {
  q: string;
  status: ProcurementRequestStatus | "";
  category: ProcurementRequestCategory | "";
  mine: boolean;
};

const FLASH: Record<string, { severity: "success" | "error" | "info"; text: string }> = {
  created: { severity: "success", text: "Procurement request saved." },
  updated: { severity: "success", text: "Request updated." },
  error: { severity: "error", text: "Something went wrong. Please try again." },
  plan: { severity: "info", text: "Procurement tools are available on Pro and Enterprise plans." },
};

function memberLabel(m: OrgMember | undefined) {
  if (!m) return "—";
  return m.full_name?.trim() || m.email;
}

function labelCategory(c: ProcurementRequestCategory) {
  const map: Record<ProcurementRequestCategory, string> = {
    chemicals: "Chemicals",
    equipment: "Equipment",
    parts: "Parts",
    services: "Services",
    other: "Other",
  };
  return map[c];
}

function ProcurementStatusChip({ status }: { status: ProcurementRequestStatus }) {
  const tone =
    status === "ordered"
      ? "success"
      : status === "cancelled"
        ? "neutral"
        : status === "approved" || status === "quoted"
          ? "info"
          : status === "in_review"
            ? "warning"
            : "primary";
  const label = status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return <StatusPill label={label} tone={tone} />;
}

export function ProcurementView({
  requests,
  orgMembers,
  vendors,
  procurementEnabled,
  initialFilters,
}: {
  requests: ProcurementRequestRow[];
  orgMembers: OrgMember[];
  vendors: VendorOption[];
  procurementEnabled: boolean;
  initialFilters: ProcurementFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProcurementRequestRow | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row: ProcurementRequestRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const vendorName = (id: string | null) => {
    if (!id) return "—";
    return vendors.find((v) => v.id === id)?.name ?? "—";
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Procurement
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Capture supply and equipment needs for your facility. Track status from submission through ordering. Pair
            requests with your{" "}
            <Link href="/app/vendors" style={{ color: "inherit", fontWeight: 600 }}>
              vendor directory
            </Link>{" "}
            to highlight preferred partners.
          </Typography>
        </div>

        {!procurementEnabled ? (
          <Alert severity="info">
            Procurement requisitions are included on Pro and Enterprise plans. Upgrade to create requests your team can
            track together.{" "}
            <Button component={Link} href="/pricing" size="small" sx={{ ml: 1 }}>
              View plans
            </Button>
          </Alert>
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Requisitions
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                New request
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label="Search title"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                sx={{ minWidth: { xs: "100%", md: 200 } }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="proc-flt-status">Status</InputLabel>
                <Select
                  labelId="proc-flt-status"
                  label="Status"
                  value={initialFilters.status}
                  onChange={(e) => {
                    const v = e.target.value as ProcurementRequestStatus | "";
                    pushParams((p) => {
                      if (v) p.set("status", v);
                      else p.delete("status");
                    });
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {PROCUREMENT_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="proc-flt-cat">Category</InputLabel>
                <Select
                  labelId="proc-flt-cat"
                  label="Category"
                  value={initialFilters.category}
                  onChange={(e) => {
                    const v = e.target.value as ProcurementRequestCategory | "";
                    pushParams((p) => {
                      if (v) p.set("category", v);
                      else p.delete("category");
                    });
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {PROCUREMENT_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {labelCategory(c)}
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
                label="My requests only"
              />
            </Stack>

            <DataTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Preferred vendor</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Created by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No requisitions match your filters. Start a request to document what your facility needs to
                          buy next.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                        <TableCell>
                          <TablePrimaryCell primary={r.title} />
                        </TableCell>
                        <TableCell>{labelCategory(r.category)}</TableCell>
                        <TableCell>
                          <ProcurementStatusChip status={r.status} />
                        </TableCell>
                        <TableCell>{vendorName(r.preferred_vendor_id)}</TableCell>
                        <TableCell>
                          <TableDateTimeCell iso={r.created_at} />
                        </TableCell>
                        <TableCell>{memberLabel(orgMembers.find((u) => u.id === r.created_by))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </DataTable>
          </>
        )}

        {procurementEnabled ? (
          <ProcurementRequestFormDialog
            open={dialogOpen}
            mode={editing ? "edit" : "create"}
            request={editing}
            vendors={vendors}
            onClose={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
          />
        ) : null}

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
