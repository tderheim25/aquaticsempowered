"use client";

import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PoolTargetsEditor } from "./PoolTargetsEditor";
import type { Database, PoolTargetRanges } from "@/types/database";

type PoolRow = Database["public"]["Tables"]["pools"]["Row"];
type EquipmentRow = Database["public"]["Tables"]["pool_equipment"]["Row"];

export function PoolDetailTabs({
  pool,
  equipment,
  updateTargetsAction,
  deleteAction,
}: {
  pool: PoolRow;
  equipment: EquipmentRow[];
  updateTargetsAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "overview";
  const [tabIndex, setTabIndex] = useState(
    tab === "targets" ? 1 : tab === "equipment" ? 2 : 0
  );

  const targets = (pool.target_ranges ?? {}) as PoolTargetRanges;

  return (
    <Box>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => {
          setTabIndex(v);
          const keys = ["overview", "targets", "equipment"];
          router.replace(`/app/pools/${pool.id}?tab=${keys[v]}`);
        }}
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" />
        <Tab label="Targets" />
        <Tab label="Equipment" />
      </Tabs>

      {tabIndex === 0 && (
        <Stack spacing={2}>
          <Typography variant="body1">
            <strong>Type:</strong> {pool.pool_type} · <strong>Status:</strong> {pool.status}
          </Typography>
          {pool.volume_gallons ? (
            <Typography variant="body2">Volume: {pool.volume_gallons.toLocaleString()} gallons</Typography>
          ) : null}
          {pool.location_label ? (
            <Typography variant="body2">Location: {pool.location_label}</Typography>
          ) : null}
          {pool.notes ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {pool.notes}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={Link} href={`/app/chemical-logs?pool_id=${pool.id}`} variant="contained">
              Log reading
            </Button>
            <Button component={Link} href={`/app/maintenance?pool=${pool.id}`} variant="outlined">
              Tasks
            </Button>
            <Button component={Link} href={`/app/pools/${pool.id}/edit`} variant="outlined">
              Edit pool
            </Button>
          </Stack>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={pool.id} />
            <Button type="submit" color="error" variant="text" size="small">
              Delete pool
            </Button>
          </form>
        </Stack>
      )}

      {tabIndex === 1 && (
        <PoolTargetsEditor poolId={pool.id} targets={targets} saveAction={updateTargetsAction} />
      )}

      {tabIndex === 2 && (
        <Stack spacing={1}>
          {equipment.length === 0 ? (
            <Typography color="text.secondary">No equipment registered.</Typography>
          ) : (
            equipment.map((e) => (
              <Typography key={e.id} variant="body2">
                {e.kind}: {e.model ?? "—"}
                {e.installed_on ? ` (installed ${e.installed_on})` : ""}
              </Typography>
            ))
          )}
          <Button component={Link} href={`/app/maintenance/equipment?pool=${pool.id}`} variant="outlined" size="small">
            Manage equipment
          </Button>
        </Stack>
      )}
    </Box>
  );
}
