"use client";

import { MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

const STORAGE_KEY = "ae_last_pool_id";

export type PoolOption = { id: string; name: string };

export function PoolContextBar({
  pools,
  basePath,
}: {
  pools: PoolOption[];
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolFromUrl = searchParams.get("pool") ?? "";

  const selected =
    poolFromUrl && pools.some((p) => p.id === poolFromUrl)
      ? poolFromUrl
      : typeof window !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEY) ?? pools[0]?.id ?? ""
        : pools[0]?.id ?? "";

  useEffect(() => {
    if (selected && typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, selected);
    }
  }, [selected]);

  const onChange = useCallback(
    (poolId: string) => {
      if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, poolId);
      const params = new URLSearchParams(searchParams.toString());
      if (poolId) params.set("pool", poolId);
      else params.delete("pool");
      const q = params.toString();
      router.push(q ? `${basePath}?${q}` : basePath);
    },
    [basePath, router, searchParams]
  );

  if (pools.length === 0) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        mb: 2,
        position: "sticky",
        top: 8,
        zIndex: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 80 }}>
          Pool context
        </Typography>
        <TextField
          select
          size="small"
          label="Active pool"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {pools.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Paper>
  );
}
