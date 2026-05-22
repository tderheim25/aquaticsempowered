"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
  Box,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Fragment } from "react";

import { compareGroups, tiers } from "./pricingData";
import { useReveal } from "./useReveal";

export function PricingCompare() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack
        ref={ref}
        spacing={1.5}
        sx={{
          textAlign: "center",
          mb: 5,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translate3d(0, 18px, 0)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "secondary.main", letterSpacing: "0.16em", fontWeight: 700 }}
        >
          Compare plans
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Every plan, side by side
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mx: "auto" }}>
          A detailed view of what&apos;s included at each level. Need something custom?
          The Enterprise tier flexes to match your network.
        </Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translate3d(0, 24px, 0)",
          transition: "opacity 700ms ease 80ms, transform 700ms ease 80ms",
          boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
        }}
      >
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    border: 0,
                    py: 2.25,
                    fontFamily: "inherit",
                  },
                }}
              >
                <TableCell sx={{ width: { xs: 220, md: 280 } }} />
                {tiers.map((t) => (
                  <TableCell
                    key={t.id}
                    align="center"
                    sx={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: t.featured ? "primary.main" : "text.primary",
                      bgcolor: t.featured ? "rgba(46,165,160,0.08)" : "transparent",
                      position: "relative",
                    }}
                  >
                    <Stack spacing={0.25} alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {t.name}
                      </Typography>
                      {t.featured ? (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "secondary.main",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Most popular
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {compareGroups.map((group) => (
                <Fragment key={group.group}>
                  <TableRow>
                    <TableCell
                      colSpan={tiers.length + 1}
                      sx={{
                        bgcolor: "rgba(0,59,111,0.04)",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                        fontSize: 11.5,
                        py: 1.25,
                        borderBottom: "1px solid",
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {group.group}
                    </TableCell>
                  </TableRow>
                  {group.rows.map((row) => (
                    <TableRow
                      key={row.label}
                      sx={{
                        transition: "background 200ms ease",
                        "&:hover": { bgcolor: "rgba(46,165,160,0.05)" },
                        "& td": { borderBottom: "1px solid", borderColor: "divider" },
                        "&:last-of-type td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500, color: "text.primary" }}>
                        {row.label}
                      </TableCell>
                      {row.values.map((v, i) => (
                        <TableCell
                          key={i}
                          align="center"
                          sx={{
                            bgcolor: tiers[i].featured ? "rgba(46,165,160,0.05)" : "transparent",
                          }}
                        >
                          {typeof v === "boolean" ? (
                            v ? (
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  mx: "auto",
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  background: tiers[i].featured
                                    ? "linear-gradient(135deg, #2EA5A0, #003B6F)"
                                    : "rgba(46,165,160,0.16)",
                                  color: tiers[i].featured ? "common.white" : "secondary.main",
                                  transition: "transform 220ms ease",
                                  "tr:hover &": { transform: "scale(1.1)" },
                                }}
                              >
                                <CheckRoundedIcon sx={{ fontSize: 16 }} />
                              </Box>
                            ) : (
                              <RemoveRoundedIcon
                                sx={{ color: "text.disabled", fontSize: 18 }}
                              />
                            )
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color:
                                  v === "—" ? "text.disabled" : "text.primary",
                              }}
                            >
                              {v}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
