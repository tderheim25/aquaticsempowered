"use client";

import {
  Box,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

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
import { POOL_ADDON_MONTHLY_USD } from "@/lib/marketing/publicPricing";
import type { PoolCatalogOrgSummary, PoolCatalogRow } from "@/lib/billing/loadPoolCatalog";

function billableStatusLabel(status: PoolCatalogRow["billableStatus"]): string {
  switch (status) {
    case "included":
      return "Included";
    case "billable":
      return "Billable";
    default:
      return "Not billed";
  }
}

function billableStatusColor(status: PoolCatalogRow["billableStatus"]): "success" | "warning" | "default" {
  switch (status) {
    case "included":
      return "success";
    case "billable":
      return "warning";
    default:
      return "default";
  }
}

export function PoolCatalogConsoleSection({
  rows,
  summaries,
}: {
  rows: PoolCatalogRow[];
  summaries: PoolCatalogOrgSummary[];
}) {
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState("all");

  const orgOptions = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.facilityName))].sort();
    return names;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (orgFilter && row.facilityName !== orgFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (billableFilter !== "all" && row.billableStatus !== billableFilter) return false;
      return true;
    });
  }, [rows, orgFilter, statusFilter, billableFilter]);

  const filteredSummary = useMemo(() => {
    if (!orgFilter) {
      const activeTotal = summaries.reduce((sum, s) => sum + s.activePoolCount, 0);
      const feesTotal = summaries.reduce((sum, s) => sum + s.monthlyPoolFeesUsd, 0);
      return { activeTotal, addonTotal: summaries.reduce((s, x) => s + x.addonQuantity, 0), feesTotal };
    }
    const org = summaries.find((s) => s.facilityName === orgFilter);
    return {
      activeTotal: org?.activePoolCount ?? 0,
      addonTotal: org?.addonQuantity ?? 0,
      feesTotal: org?.monthlyPoolFeesUsd ?? 0,
    };
  }, [summaries, orgFilter]);

  return (
    <Stack spacing={2}>
      <AeConsolePanel>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
          <TextField
            select
            size="small"
            label="Facility"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All facilities</MenuItem>
            {orgOptions.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="seasonal">Seasonal</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Billable status"
            value={billableFilter}
            onChange={(e) => setBillableFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="included">Included (free)</MenuItem>
            <MenuItem value="billable">Billable</MenuItem>
            <MenuItem value="not_billed">Not billed</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${filteredSummary.activeTotal} active pools`} size="small" />
            <Chip label={`${filteredSummary.addonTotal} billable add-ons`} size="small" color="warning" variant="outlined" />
            <Chip
              label={`$${filteredSummary.feesTotal}/mo pool fees`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          First active pool per organization is included. Each additional active pool bills ${POOL_ADDON_MONTHLY_USD}/month.
        </Typography>
      </AeConsolePanel>

      <AeConsolePanel noPadding>
        <DataTable embedded>
          <TableHead>
            <TableRow>
              <TableCell>Pool</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell>Body of water</TableCell>
              <TableCell>Sanitizer</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Billable</TableCell>
              <TableCell align="right">Monthly fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No pools match the current filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TablePrimaryCell primary={row.name} />
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{row.facilityName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.planCode}
                        {row.founder ? " · founder" : ""}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.waterBodyLabel}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.sanitizerType}</TableCell>
                  <TableCell>{row.location ?? "—"}</TableCell>
                  <TableCell>{row.volumeGallons ? `${row.volumeGallons.toLocaleString()} gal` : "—"}</TableCell>
                  <TableCell>
                    <StatusPill label={row.status} />
                  </TableCell>
                  <TableDateTimeCell iso={row.createdAt} />
                  <TableCell>
                    <Chip
                      size="small"
                      label={billableStatusLabel(row.billableStatus)}
                      color={billableStatusColor(row.billableStatus)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {row.monthlyPoolFeeUsd === 0 ? "$0" : `$${row.monthlyPoolFeeUsd}`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </AeConsolePanel>
    </Stack>
  );
}
