"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { AddVendorModal } from "@/components/super-admin/AddVendorModal";
import { EditVendorDialog } from "@/components/super-admin/EditVendorDialog";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import { VendorLogoUpload } from "@/components/super-admin/VendorLogoUpload";
import type { VendorContact, VendorListRow } from "@/components/super-admin/vendorConsoleTypes";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableRowActions,
} from "@/components/ui/data-table";

function vendorContactEmail(contact: VendorContact | null | undefined) {
  const email = contact?.email?.trim();
  return email || null;
}

function vendorContactPhone(contact: VendorContact | null | undefined) {
  const phone = contact?.phone?.trim();
  return phone || null;
}

function formatWebsiteHref(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export function VendorDirectorySection({
  vendorsList,
  productCountByVendor,
}: {
  vendorsList: VendorListRow[];
  productCountByVendor: Map<string, number>;
}) {
  const [editing, setEditing] = useState<VendorListRow | null>(null);

  return (
    <Stack spacing={2}>
      <AddVendorModal />

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Listed vendors ({vendorsList.length})
      </Typography>
      {vendorsList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No vendors yet. Approve a request or add one manually.
        </Typography>
      ) : (
        <AeConsolePanel noPadding>
          <DataTable embedded stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Logo</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Website</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Listing</TableCell>
                <TableCell>Public profile</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendorsList.map((v) => {
                const contact = v.contact as VendorContact | null;
                const email = vendorContactEmail(contact);
                const phone = vendorContactPhone(contact);
                const productCount = productCountByVendor.get(v.id) ?? 0;
                return (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ minWidth: 140, verticalAlign: "top" }}>
                      <VendorLogoUpload vendorId={v.id} vendorName={v.name} logoUrl={v.logo_url} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2" component="div" fontWeight={700}>
                        {v.name}
                      </Typography>
                      {v.tagline ? (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                          {v.tagline}
                        </Typography>
                      ) : v.description ? (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                          {v.description.slice(0, 60)}
                          {v.description.length > 60 ? "…" : ""}
                        </Typography>
                      ) : null}
                      {v.is_partner ? (
                        <Chip label="Partner" size="small" color="secondary" sx={{ mt: 0.5 }} />
                      ) : null}
                    </TableCell>
                    <TableCell>{v.category || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      {v.website_url ? (
                        <Typography
                          component="a"
                          href={formatWebsiteHref(v.website_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                          noWrap
                          sx={{ display: "block", maxWidth: 180 }}
                        >
                          {v.website_url.replace(/^https?:\/\//, "")}
                        </Typography>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      {email ? (
                        <Typography
                          component="a"
                          href={`mailto:${email}`}
                          variant="body2"
                          noWrap
                          sx={{ display: "block", maxWidth: 160 }}
                        >
                          {email}
                        </Typography>
                      ) : null}
                      {phone ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {phone}
                        </Typography>
                      ) : null}
                      {!email && !phone ? "—" : null}
                    </TableCell>
                    <TableCell>{v.region || "—"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {productCount}
                        </Typography>
                        {productCount > 0 ? (
                          <Typography
                            component={Link}
                            href={`/private/ae-console?section=vendors&tab=products`}
                            variant="caption"
                            color="primary"
                          >
                            View
                          </Typography>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={v.listing_visible ? "Visible" : "Hidden"}
                        tone={v.listing_visible ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell>
                      {v.slug ? (
                        <Typography
                          component={Link}
                          href={`/vendors/${v.slug}`}
                          target="_blank"
                          variant="body2"
                          color="primary"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          /vendors/{v.slug}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No slug
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TableRowActions>
                        <Tooltip title="Edit vendor">
                          <IconButton size="small" onClick={() => setEditing(v)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableRowActions>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </AeConsolePanel>
      )}

      <EditVendorDialog vendor={editing} onClose={() => setEditing(null)} />
    </Stack>
  );
}
