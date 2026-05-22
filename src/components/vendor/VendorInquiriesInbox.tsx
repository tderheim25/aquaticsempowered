"use client";

import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";

export type VendorInquiryRow = {
  id: string;
  product_id: string;
  from_name: string;
  from_email: string;
  from_org_name: string | null;
  message: string;
  status: "open" | "read" | "resolved";
  created_at: string;
  vendor_products: { id: string; name: string; image_url: string | null } | { id: string; name: string; image_url: string | null }[];
};

function productFromRow(row: VendorInquiryRow) {
  const p = row.vendor_products;
  return Array.isArray(p) ? p[0] : p;
}

function statusColor(status: VendorInquiryRow["status"]) {
  if (status === "open") return "error";
  if (status === "read") return "warning";
  return "default";
}

export function VendorInquiriesInbox({ vendorId }: { vendorId: string }) {
  const [inquiries, setInquiries] = useState<VendorInquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/inquiries", { cache: "no-store" });
      if (!res.ok) {
        setInquiries([]);
        return;
      }
      const data = (await res.json()) as { inquiries?: VendorInquiryRow[] };
      const list = data.inquiries ?? [];
      setInquiries(list);
      setSelectedId((prev) => {
        if (prev && list.some((i) => i.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 12_000);

    const supabase = createClient();
    const channel = supabase
      .channel(`vendor-inquiries:${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vendor_product_inquiries",
          filter: `vendor_id=eq.${vendorId}`,
        },
        () => void refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vendor_product_inquiries",
          filter: `vendor_id=eq.${vendorId}`,
        },
        () => void refresh()
      )
      .subscribe();

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [vendorId, refresh]);

  const selected = useMemo(
    () => inquiries.find((i) => i.id === selectedId) ?? null,
    [inquiries, selectedId]
  );

  const openCount = inquiries.filter((i) => i.status === "open").length;

  const setStatus = async (id: string, status: VendorInquiryRow["status"]) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/vendor/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) void refresh();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", minHeight: 420 }}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ minHeight: 420 }}>
        <Box
          sx={{
            width: { xs: "100%", md: 320 },
            flexShrink: 0,
            borderRight: { md: 1 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: "divider",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Marketplace inquiries
            </Typography>
            {openCount > 0 ? (
              <Chip size="small" color="error" label={`${openCount} new`} />
            ) : null}
          </Stack>
          <Divider />
          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : inquiries.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No product inquiries yet. When operators ask about your marketplace listings, they will appear here.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ maxHeight: { md: 360 }, overflow: "auto" }}>
              {inquiries.map((row) => {
                const product = productFromRow(row);
                const active = row.id === selectedId;
                return (
                  <ListItemButton
                    key={row.id}
                    selected={active}
                    onClick={() => {
                      setSelectedId(row.id);
                      if (row.status === "open") void setStatus(row.id, "read");
                    }}
                    alignItems="flex-start"
                    sx={{ py: 1.25 }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {row.from_name}
                          </Typography>
                          {row.status === "open" ? (
                            <Badge color="error" variant="dot" sx={{ "& .MuiBadge-badge": { top: 4, right: -4 } }} />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {product?.name ?? "Product"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {row.message}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 2.5 } }}>
          {!selected ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", minHeight: 280, color: "text.secondary" }}>
              <StorefrontOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
              <Typography variant="body2">Select an inquiry to read the full message</Typography>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {productFromRow(selected)?.name ?? "Product inquiry"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From {selected.from_name}
                    {selected.from_org_name ? ` · ${selected.from_org_name}` : ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selected.from_email} · {formatCommunityTimestamp(selected.created_at)}
                  </Typography>
                </Box>
                <Chip size="small" label={selected.status} color={statusColor(selected.status)} />
              </Stack>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default", flex: 1 }}>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selected.message}
                </Typography>
              </Paper>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selected.status !== "read" && selected.status !== "resolved" ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MarkEmailReadOutlinedIcon />}
                    disabled={updating}
                    onClick={() => void setStatus(selected.id, "read")}
                  >
                    Mark read
                  </Button>
                ) : null}
                {selected.status !== "resolved" ? (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={updating}
                    onClick={() => void setStatus(selected.id, "resolved")}
                  >
                    Mark resolved
                  </Button>
                ) : null}
                <Button
                  size="small"
                  variant="text"
                  component="a"
                  href={`mailto:${selected.from_email}?subject=${encodeURIComponent(`Re: ${productFromRow(selected)?.name ?? "your inquiry"}`)}`}
                >
                  Reply by email
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
