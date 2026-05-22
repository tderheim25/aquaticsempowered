"use client";

import { Button, Typography } from "@mui/material";
import Link from "next/link";

import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableMutedCell,
  TableNumericCell,
  TablePrimaryCell,
  TableRow,
  TableRowActions,
} from "@/components/ui/data-table";
import type { PoolStatus, PoolType } from "@/types/database";

export type PoolListItem = {
  id: string;
  name: string;
  pool_type: PoolType;
  status: PoolStatus;
  volume_gallons: number | null;
  location_label: string | null;
  lastReadingAt: string | null;
};

function formatPoolType(type: PoolType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function PoolsList({ pools }: { pools: PoolListItem[] }) {
  return (
    <DataTable stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Pool</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Volume</TableCell>
          <TableCell>Location</TableCell>
          <TableCell>Last reading</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {pools.map((pool) => (
          <TableRow key={pool.id} hover>
            <TableCell sx={{ minWidth: 160 }}>
              <TablePrimaryCell
                primary={
                  <Link href={`/app/pools/${pool.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {pool.name}
                  </Link>
                }
                monogram={pool.name}
              />
            </TableCell>
            <TableCell>
              <TableMutedCell>{formatPoolType(pool.pool_type)}</TableMutedCell>
            </TableCell>
            <TableCell>
              <StatusPill label={pool.status} />
            </TableCell>
            <TableCell align="right">
              {pool.volume_gallons != null ? (
                <TableNumericCell value={pool.volume_gallons.toLocaleString()} unit="gal" />
              ) : (
                <TableMutedCell>—</TableMutedCell>
              )}
            </TableCell>
            <TableCell>
              <TableMutedCell>{pool.location_label ?? "—"}</TableMutedCell>
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {pool.lastReadingAt ? (
                <TableDateTimeCell iso={pool.lastReadingAt} />
              ) : (
                <TableMutedCell>No readings</TableMutedCell>
              )}
            </TableCell>
            <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
              <TableRowActions>
                <Button
                  component={Link}
                  href={`/app/chemical-logs?pool_id=${pool.id}`}
                  size="small"
                  variant="contained"
                >
                  Log reading
                </Button>
                <Button component={Link} href={`/app/maintenance?pool=${pool.id}`} size="small" variant="outlined">
                  Tasks
                </Button>
                <Button component={Link} href={`/app/pools/${pool.id}/edit`} size="small" variant="outlined">
                  Edit
                </Button>
              </TableRowActions>
            </TableCell>
          </TableRow>
        ))}
        {pools.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>
              <Typography variant="body2" color="text.secondary">
                No pools to display.
              </Typography>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </DataTable>
  );
}
