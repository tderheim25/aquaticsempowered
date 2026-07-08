"use client";

import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState, useTransition } from "react";

import {
  previewPilotImportAction,
  runPilotImportAction,
  type PilotImportActionResult,
} from "@/app/private/ae-console/pilot-import/actions";
import { AeConsolePanel, AeConsoleSectionHeader } from "@/components/super-admin/AeConsolePrimitives";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import { PILOT_IMPORT_CSV_TEMPLATE } from "@/lib/pilot/pilotConstants";

function statusTone(status: string): "success" | "warning" | "error" | "neutral" {
  if (status === "created" || status === "linked") return "success";
  if (status === "skipped") return "warning";
  if (status === "error") return "error";
  return "neutral";
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadTemplateCsv() {
  downloadCsvFile("pilot-import-template.csv", PILOT_IMPORT_CSV_TEMPLATE);
}

function downloadErrorCsv(result: PilotImportActionResult) {
  const failed = result.rowResults.filter((r) => r.status === "error" || r.status === "skipped");
  if (failed.length === 0) return;
  const header = "line,email,org_name,status,message\n";
  const rows = failed
    .map((r) =>
      [r.line, r.email, r.orgName, r.status, r.message ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  downloadCsvFile("pilot-import-errors.csv", header + rows);
}

export function PilotImportConsoleSection() {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(true);
  const [preview, setPreview] = useState<PilotImportActionResult | null>(null);
  const [result, setResult] = useState<PilotImportActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const runPreviewForCsv = (text: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await previewPilotImportAction(text);
        if (!res.ok && res.errors.length > 0) {
          setError(res.errors.join("\n"));
        }
        setPreview(res);
        setResult(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preview failed");
        setPreview(null);
      }
    });
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setResult(null);
    setError(null);
    runPreviewForCsv(text);
  };

  const runImport = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await runPilotImportAction(csvText, sendWelcomeEmails);
        if (!res.ok && res.errors.length > 0) {
          setError(res.errors.join("\n"));
        }
        setResult(res);
        setPreview(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      }
    });
  };

  const activeResult = result ?? preview;
  const welcomeEmailCount =
    sendWelcomeEmails && activeResult?.preview ? activeResult.preview.welcomeEmails : 0;

  const importFinished = Boolean(result && !result.dryRun);
  const createdCount = result?.rowResults.filter((r) => r.status === "created").length ?? 0;
  const linkedCount = result?.rowResults.filter((r) => r.status === "linked").length ?? 0;
  const errorCount = result?.rowResults.filter((r) => r.status === "error").length ?? 0;

  const successMessage = importFinished
    ? [
        "Pilot import complete.",
        createdCount > 0
          ? `${createdCount} new account${createdCount === 1 ? "" : "s"} created.`
          : null,
        linkedCount > 0
          ? `${linkedCount} existing account${linkedCount === 1 ? "" : "s"} linked.`
          : null,
        sendWelcomeEmails && createdCount > 0
          ? "Welcome emails sent to new accounts."
          : !sendWelcomeEmails && createdCount > 0
            ? "No welcome emails were sent."
            : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <Stack spacing={3}>
      <AeConsoleSectionHeader
        title="Pilot import"
        description="Bulk-create pilot organizations, users, and complimentary enterprise access through September 2026."
      />

      <AeConsolePanel>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Upload a CSV with one row per user. Rows sharing the same <code>org_name</code> belong to
            the same billing account. Required columns: org_name, org_tier, facility_name, user_email,
            user_full_name, user_role, is_owner.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={pending}
            >
              Choose CSV file
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={downloadTemplateCsv}
              disabled={pending}
            >
              Download template
            </Button>
            {fileName ? (
              <Chip label={fileName} size="small" variant="outlined" sx={{ maxWidth: 280 }} />
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                void handleFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={sendWelcomeEmails}
                onChange={(e) => setSendWelcomeEmails(e.target.checked)}
              />
            }
            label="Send welcome emails after import (new accounts only)"
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -1 }}>
            To resend credentials later, go to <strong>Users</strong> → envelope icon → Send login
            email (generates a new temporary password).
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={runImport}
              disabled={!csvText.trim() || !preview || pending || Boolean(error)}
              color="primary"
            >
              Import
            </Button>
          </Stack>

          {pending && !activeResult ? (
            <Typography variant="body2" color="text.secondary">
              Validating CSV…
            </Typography>
          ) : null}

          {error ? (
            <Alert severity="error" sx={{ whiteSpace: "pre-wrap" }}>
              {error}
            </Alert>
          ) : null}

          {importFinished && result?.ok && successMessage ? (
            <Alert severity="success">{successMessage}</Alert>
          ) : null}

          {importFinished && result && !result.ok && !error ? (
            <Alert severity="warning">
              Import finished with {errorCount} error{errorCount === 1 ? "" : "s"}. Review the row
              results below.
            </Alert>
          ) : null}

          {activeResult?.preview ? (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {result ? "Import summary" : "Preview"}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                <StatusPill label={`${activeResult.preview.orgs.length} orgs`} tone="neutral" />
                <StatusPill
                  label={`${activeResult.preview.usersToCreate} new users`}
                  tone="success"
                />
                <StatusPill
                  label={`${activeResult.preview.usersExisting} existing users`}
                  tone="warning"
                />
                <StatusPill label={`${welcomeEmailCount} welcome emails`} tone="neutral" />
              </Stack>

              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Facilities</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeResult.preview.orgs.map((org) => (
                    <TableRow key={org.orgName}>
                      <TableCell>
                        <TablePrimaryCell primary={org.orgName} />
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={
                            result
                              ? org.exists
                                ? "Existing"
                                : "Created"
                              : org.exists
                                ? "Existing"
                                : "Will create"
                          }
                          tone={org.exists && !result ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell>{org.userCount}</TableCell>
                      <TableCell>{org.facilities.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </Box>
          ) : null}

          {activeResult && activeResult.rowResults.length > 0 ? (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Row results
                </Typography>
                {activeResult.rowResults.some((r) => r.status === "error" || r.status === "skipped") ? (
                  <Button
                    size="small"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() => downloadErrorCsv(activeResult)}
                  >
                    Download error CSV
                  </Button>
                ) : null}
              </Stack>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Line</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeResult.rowResults.map((row) => (
                    <TableRow key={`${row.line}-${row.email}`}>
                      <TableCell>{row.line}</TableCell>
                      <TableCell>
                        <TablePrimaryCell primary={row.email} />
                      </TableCell>
                      <TableCell>{row.orgName}</TableCell>
                      <TableCell>
                        <StatusPill label={row.status} tone={statusTone(row.status)} />
                      </TableCell>
                      <TableCell>{row.message ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </Box>
          ) : null}
        </Stack>
      </AeConsolePanel>
    </Stack>
  );
}
