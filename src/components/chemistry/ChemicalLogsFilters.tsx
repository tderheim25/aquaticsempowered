"use client";

import { MenuItem, Stack, TextField } from "@mui/material";
import { useRouter } from "next/navigation";

export type ChemicalLogsFilterPool = { id: string; name: string };

export function ChemicalLogsFilters({
  pools,
  poolId,
  date,
  orgQuery,
}: {
  pools: ChemicalLogsFilterPool[];
  poolId: string;
  date: string;
  orgQuery?: string;
}) {
  const router = useRouter();

  function navigate(nextPoolId: string, nextDate: string) {
    const params = new URLSearchParams();
    if (orgQuery) params.set("org", orgQuery);
    if (nextPoolId) params.set("pool_id", nextPoolId);
    if (nextDate) params.set("date", nextDate);
    const qs = params.toString();
    router.push(`/app/chemical-logs${qs ? `?${qs}` : ""}`);
  }

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
      <TextField
        label="Pool"
        size="small"
        select
        value={poolId}
        onChange={(e) => navigate(e.target.value, date)}
        sx={{ minWidth: 220 }}
      >
        {pools.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Date"
        type="date"
        size="small"
        value={date}
        onChange={(e) => navigate(poolId, e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 180 }}
      />
    </Stack>
  );
}
