"use client";

import { Table, TableContainer, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

import { dataTableContainerSx } from "@/theme/dataTable";

export type DataTableProps = {
  children: ReactNode;
  /** Inside AeConsolePanel / cards — no outer chrome */
  embedded?: boolean;
  /** Key-value detail grid (no pill header styling) */
  variant?: "default" | "definition";
  stickyHeader?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
};

const definitionTableSx: SxProps<Theme> = {
  borderCollapse: "collapse",
  "& .MuiTableBody-root .MuiTableRow-root": {
    "& .MuiTableCell-root": {
      py: 1.25,
      px: 0,
      bgcolor: "transparent",
    },
    "&:hover .MuiTableCell-root": {
      bgcolor: "transparent",
    },
  },
};

export function DataTable({
  children,
  embedded = false,
  variant = "default",
  stickyHeader,
  size = "small",
  sx,
}: DataTableProps) {
  const isDefinition = variant === "definition";

  return (
    <TableContainer
      sx={[
        (theme) => dataTableContainerSx(theme, embedded || isDefinition),
        isDefinition ? { p: 0 } : {},
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <Table
        size={size}
        stickyHeader={stickyHeader}
        sx={isDefinition ? definitionTableSx : undefined}
      >
        {children}
      </Table>
    </TableContainer>
  );
}
