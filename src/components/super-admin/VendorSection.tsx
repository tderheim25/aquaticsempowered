import { Suspense } from "react";

import {
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableDateTimeCell,
  TableHead,
  TableRow,
} from "@/components/ui/data-table";

import { reviewVendorApplicationAction } from "@/app/private/ae-console/platform/vendorActions";
import { VendorDirectorySection } from "@/components/super-admin/VendorDirectorySection";
import { AeConsolePanel } from "@/components/super-admin/AeConsolePrimitives";
import { VendorProductsSection } from "@/components/super-admin/VendorProductsSection";
import { VendorConsoleTabs, type VendorConsoleTab } from "@/components/super-admin/VendorConsoleTabs";
import type {
  VendorApplicationRow,
  VendorListRow,
  VendorProductRow,
} from "@/components/super-admin/vendorConsoleTypes";

export type { VendorApplicationRow, VendorListRow, VendorProductRow };

export function VendorSection({
  tab,
  vendorApps,
  vendorsList,
  vendorProducts,
}: {
  tab: VendorConsoleTab;
  vendorApps: VendorApplicationRow[];
  vendorsList: VendorListRow[];
  vendorProducts: VendorProductRow[];
  /**
   * Kept in the prop signature for backwards compatibility with callers
   * that still pass `status`. Toast notifications are handled centrally
   * by `<StatusToast>` in `AeConsolePageContent`, so this prop is unused
   * here.
   */
  status?: string;
}) {
  const pending = vendorApps.filter((a) => a.status === "pending");
  const pendingCount = pending.length;

  const productCountByVendor = new Map<string, number>();
  for (const p of vendorProducts) {
    productCountByVendor.set(p.vendor_id, (productCountByVendor.get(p.vendor_id) ?? 0) + 1);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Review partner applications from the public vendor page, then manage approved listings in the directory.
      </Typography>
      <Suspense fallback={null}>
        <VendorConsoleTabs pendingCount={pendingCount} />
      </Suspense>

      {tab === "requests" ? (
        <Stack spacing={2}>
          {pendingCount === 0 ? (
            <AeConsolePanel sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No pending requests. New applications from{" "}
                <Typography component="span" fontWeight={600}>
                  /vendors
                </Typography>{" "}
                will appear here.
              </Typography>
            </AeConsolePanel>
          ) : null}

          {pending.map((app) => (
            <AeConsolePanel key={app.id}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Stack spacing={0.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {app.company_name}
                  </Typography>
                  <Chip label="Pending review" size="small" color="warning" sx={{ alignSelf: "flex-start" }} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Submitted {new Date(app.created_at).toLocaleString()}
                </Typography>
              </Stack>

              <DataTable embedded variant="definition" sx={{ mt: 2, maxWidth: 640 }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 140, border: 0 }}>Contact</TableCell>
                    <TableCell sx={{ border: 0 }}>{app.contact_name || "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: 0 }}>Email</TableCell>
                    <TableCell sx={{ border: 0 }}>
                      <Typography component="a" href={`mailto:${app.email}`} variant="body2">
                        {app.email}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: 0 }}>Phone</TableCell>
                    <TableCell sx={{ border: 0 }}>{app.phone || "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: 0 }}>Category</TableCell>
                    <TableCell sx={{ border: 0 }}>{app.category || "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, border: 0 }}>Website</TableCell>
                    <TableCell sx={{ border: 0 }}>
                      {app.website_url ? (
                        <Typography
                          component="a"
                          href={app.website_url.startsWith("http") ? app.website_url : `https://${app.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                        >
                          {app.website_url}
                        </Typography>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </DataTable>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
                Inquiry / message
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {app.message}
              </Typography>

              <Stack component="form" action={reviewVendorApplicationAction} spacing={1.5} sx={{ mt: 2 }}>
                <input type="hidden" name="applicationId" value={app.id} />
                <TextField name="reviewNote" label="Internal note (optional)" size="small" fullWidth multiline rows={2} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button type="submit" name="decision" value="approved" variant="contained">
                    Approve & create listing
                  </Button>
                  <Button type="submit" name="decision" value="rejected" variant="outlined" color="error">
                    Reject
                  </Button>
                </Stack>
              </Stack>
            </AeConsolePanel>
          ))}

          {vendorApps.filter((a) => a.status !== "pending").length > 0 ? (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, pt: 1 }}>
                Processed applications
              </Typography>
              <AeConsolePanel noPadding>
                <DataTable embedded>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorApps
                      .filter((a) => a.status !== "pending")
                      .map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>{app.company_name}</TableCell>
                          <TableCell>{app.contact_name || "—"}</TableCell>
                          <TableCell>{app.email}</TableCell>
                          <TableCell>
                            <StatusPill label={app.status} />
                          </TableCell>
                          <TableCell>
                            <TableDateTimeCell iso={app.created_at} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </DataTable>
              </AeConsolePanel>
            </>
          ) : null}
        </Stack>
      ) : null}

      {tab === "directory" ? (
        <VendorDirectorySection vendorsList={vendorsList} productCountByVendor={productCountByVendor} />
      ) : null}

      {tab === "products" ? (
        <VendorProductsSection vendorsList={vendorsList} products={vendorProducts} />
      ) : null}
    </Stack>
  );
}
