import { alpha, type Theme } from "@mui/material/styles";

/**
 * Editorial table system
 *
 * Design notes:
 * - No header fill. A single hairline rule underneath. Micro uppercase labels.
 * - Tabular numerals across the body so numbers/dates align visually.
 * - Hover slides a 3px primary accent bar in from the left of the first cell.
 * - Subtle alternating background (very light, "engineered" zebra).
 * - First and last columns get extra side padding for breathing room.
 * - `.row-actions` children fade in on row hover (use for icon button groups).
 */
export function dataTableContainerSx(theme: Theme, embedded = false) {
  if (embedded) {
    return {
      overflowX: "auto" as const,
      bgcolor: "transparent",
      boxShadow: "none",
      border: "none",
      borderRadius: 0,
      position: "relative" as const,
    };
  }
  return {
    overflowX: "auto" as const,
    borderRadius: 2,
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
    position: "relative" as const,
  };
}

const headerCellSx = (theme: Theme) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
  backgroundColor: "transparent",
  color: alpha(theme.palette.text.secondary, 0.78),
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.085em",
  textTransform: "uppercase" as const,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  whiteSpace: "nowrap" as const,
  "&:first-of-type": {
    paddingLeft: theme.spacing(3),
  },
  "&:last-of-type": {
    paddingRight: theme.spacing(3),
  },
});

const bodyCellSx = (theme: Theme) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  fontSize: "0.875rem",
  fontVariantNumeric: "tabular-nums" as const,
  backgroundColor: "transparent",
  verticalAlign: "middle" as const,
  color: theme.palette.text.primary,
  "&:first-of-type": {
    paddingLeft: theme.spacing(3),
    position: "relative" as const,
  },
  "&:last-of-type": {
    paddingRight: theme.spacing(3),
  },
});

export const dataTableThemeOverrides = {
  MuiTableContainer: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        ...dataTableContainerSx(theme),
      }),
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: "collapse" as const,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        "& .MuiTableRow-root": {
          "& .MuiTableCell-root": headerCellSx(theme),
          "& .MuiTableCell-stickyHeader": {
            ...headerCellSx(theme),
            backgroundColor: theme.palette.background.paper,
          },
          "& .MuiTableSortLabel-root": {
            color: "inherit",
            fontSize: "inherit",
            fontWeight: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            "&.Mui-active": { color: theme.palette.primary.main },
            "& .MuiTableSortLabel-icon": {
              opacity: 0.45,
              fontSize: "0.95rem",
            },
          },
        },
      }),
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        "& .MuiTableRow-root": {
          transition: theme.transitions.create(["background-color"], { duration: 140 }),
          "& .MuiTableCell-root": bodyCellSx(theme),
          "& .MuiTableCell-root:first-of-type::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: theme.palette.primary.main,
            opacity: 0,
            transform: "scaleY(0.3)",
            transformOrigin: "center",
            transition: theme.transitions.create(["opacity", "transform"], { duration: 180 }),
          },
          "& .row-actions": {
            opacity: 0.35,
            transition: theme.transitions.create(["opacity", "transform"], { duration: 160 }),
          },
          "&:nth-of-type(even) .MuiTableCell-root": {
            backgroundColor: alpha(theme.palette.text.primary, 0.014),
          },
          "&:last-child .MuiTableCell-root": {
            borderBottom: 0,
          },
          "&:hover .MuiTableCell-root": {
            backgroundColor: alpha(theme.palette.primary.main, 0.035),
          },
          "&:hover .MuiTableCell-root:first-of-type::before": {
            opacity: 1,
            transform: "scaleY(1)",
          },
          "&:hover .row-actions": { opacity: 1 },
        },
        "& .MuiTableRow-root.Mui-selected .MuiTableCell-root": {
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
        },
        "& .MuiTableRow-root.Mui-selected .MuiTableCell-root:first-of-type::before": {
          opacity: 1,
          transform: "scaleY(1)",
          width: 4,
        },
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: 0,
      },
    },
  },
};
