"use client";

import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT,
  type CommunityEnergyAuditUsage,
} from "@/lib/energy-audit/communityAuditLimits.shared";
import { parseEnergyAuditMarkdown } from "@/lib/energy-audit/parseEnergyAuditMarkdown";

import { communityContainedButtonSx, communitySectionTitleSx, communitySurfacePaperSx } from "./communityUi";

const AUDIT_LOGIN_NEXT = encodeURIComponent("/community?tab=programs#community-energy-audit");

const FACILITY_TYPES = [
  { value: "", label: "Select type (optional)" },
  { value: "municipal", label: "Municipal / parks" },
  { value: "hoa", label: "HOA / condo" },
  { value: "hotel", label: "Hotel / resort" },
  { value: "school", label: "School / university" },
  { value: "ymca", label: "YMCA / rec center" },
  { value: "therapy", label: "Therapy / clinical" },
  { value: "other", label: "Other" },
];

const BODY_TYPES = [
  { value: "", label: "Select water body (optional)" },
  { value: "pool", label: "Pool" },
  { value: "spa", label: "Spa / hot tub" },
  { value: "splash", label: "Splash pad" },
  { value: "therapy", label: "Therapy pool" },
  { value: "lazy", label: "Lazy river / play feature" },
  { value: "other", label: "Other" },
];

function formatResetsAt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EnergyAuditLimitNotice({
  usage,
  canInteract,
}: {
  usage: CommunityEnergyAuditUsage | null;
  canInteract: boolean;
}) {
  if (!canInteract) {
    return (
      <Alert severity="info">
        Sign in to run energy audits. Each account can generate up to{" "}
        <strong>{COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} reports per day</strong>. No organization is required.
      </Alert>
    );
  }

  if (!usage?.signedIn) {
    return (
      <Alert severity="info">
        Sign in to run energy audits. Each account can generate up to{" "}
        <strong>{COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} reports per day</strong>.
      </Alert>
    );
  }

  if (usage.atLimit) {
    return (
      <Alert severity="warning">
        You have used all <strong>{usage.limit}</strong> energy audits for today. Your limit resets around{" "}
        <strong>{formatResetsAt(usage.resetsAt)}</strong> (UTC).
      </Alert>
    );
  }

  return (
    <Alert severity="info">
      Daily limit: <strong>{usage.remaining}</strong> of <strong>{usage.limit}</strong> energy audits remaining today
      (resets around {formatResetsAt(usage.resetsAt)} UTC).
    </Alert>
  );
}

function MarkdownReport({ content }: { content: string }) {
  const sections = parseEnergyAuditMarkdown(content);
  return (
    <Stack spacing={2}>
      {sections.map((section, i) => (
        <Box key={i}>
          {section.heading ? (
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>
              {section.heading}
            </Typography>
          ) : null}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
            {section.body}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

export type CommunityEnergyAuditWizardProps = {
  canInteract: boolean;
};

export function CommunityEnergyAuditWizard({ canInteract }: CommunityEnergyAuditWizardProps) {
  const [facilityName, setFacilityName] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [bodyOfWater, setBodyOfWater] = useState("");
  const [sizeNotes, setSizeNotes] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usage, setUsage] = useState<CommunityEnergyAuditUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string | null>(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(null);

  const refreshUsage = useCallback(async () => {
    if (!canInteract) {
      setUsage(null);
      setUsageLoading(false);
      return;
    }

    setUsageLoading(true);
    try {
      const res = await fetch("/api/community/energy-audit/usage");
      if (res.ok) {
        const data = (await res.json()) as CommunityEnergyAuditUsage;
        setUsage(data);
      }
    } catch {
      // Non-blocking — server still enforces limits on submit.
    } finally {
      setUsageLoading(false);
    }
  }, [canInteract]);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  const atLimit = Boolean(usage?.signedIn && usage.atLimit);
  const canGenerate = canInteract && usage?.signedIn && !atLimit && !usageLoading;

  const reset = () => {
    setReport(null);
    setReportTitle(null);
    setReportGeneratedAt(null);
    setError(null);
  };

  const runAudit = async () => {
    const name = facilityName.trim();
    if (!name) {
      setError("Enter a facility or pool name to start.");
      return;
    }

    if (!canInteract) {
      setError("Sign in to run energy audits.");
      return;
    }

    if (atLimit) {
      setError(`You have reached the daily limit of ${COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} energy audits.`);
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/community/energy-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityName: name,
          facilityType: facilityType || undefined,
          bodyOfWater: bodyOfWater || undefined,
          sizeNotes: sizeNotes.trim() || undefined,
          equipmentNotes: equipmentNotes.trim() || undefined,
          scheduleNotes: scheduleNotes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        report?: string;
        title?: string;
        usage?: CommunityEnergyAuditUsage;
      };

      if (!res.ok) {
        if (data.usage) setUsage(data.usage);
        setError(data.error ?? "Could not generate the audit.");
        return;
      }

      setReport(data.report ?? "");
      setReportTitle(data.title ?? name);
      setReportGeneratedAt(new Date().toISOString());
      if (data.usage) setUsage(data.usage);
      else void refreshUsage();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!report || !reportTitle) return;

    setPdfLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/community/energy-audit/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reportTitle,
          report,
          generatedAt: reportGeneratedAt ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not create the PDF.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "energy-audit.pdf";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download the PDF. Try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const formDisabled = loading || !canGenerate;

  return (
    <Paper id="community-energy-audit" variant="outlined" sx={communitySurfacePaperSx({ scrollMarginTop: 88 })}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <BoltOutlinedIcon color="primary" />
        <Typography variant="h6" sx={communitySectionTitleSx}>
          Facility energy audit
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
        No organization required. Sign in to generate up to {COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} energy audit reports
        per day and share them with your board or operator team.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <EnergyAuditLimitNotice usage={usage} canInteract={canInteract} />
      </Box>

      {report ? (
        <Stack spacing={2}>
          <Alert severity="success">
            Report ready for <strong>{reportTitle?.replace(/\s*—\s*energy audit$/i, "")}</strong>. Review below and
            validate on site before capital decisions.
          </Alert>
          {atLimit ? (
            <Alert severity="warning">
              You have used all {COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} audits for today. Download this report now; you can
              run another audit after your daily limit resets.
            </Alert>
          ) : null}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              maxHeight: { xs: "none", md: 520 },
              overflowY: "auto",
            }}
          >
            <MarkdownReport content={report} />
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
            <Button
              variant="contained"
              onClick={downloadPdf}
              disabled={pdfLoading}
              startIcon={
                pdfLoading ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfOutlinedIcon />
              }
              sx={{ minHeight: 44, ...communityContainedButtonSx() }}
            >
              {pdfLoading ? "Preparing PDF…" : "Download PDF"}
            </Button>
            <Button
              variant="outlined"
              onClick={reset}
              sx={{ minHeight: 44 }}
              disabled={pdfLoading || atLimit}
            >
              Run another audit
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {!canInteract ? (
            <Button
              component={Link}
              href={`/login?next=${AUDIT_LOGIN_NEXT}`}
              variant="contained"
              sx={{ minHeight: 44, alignSelf: "flex-start", ...communityContainedButtonSx() }}
            >
              Sign in to start
            </Button>
          ) : null}

          <TextField
            label="Facility or pool name"
            required
            fullWidth
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. Riverside Community Pool"
            disabled={formDisabled}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              label="Facility type"
              fullWidth
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              disabled={formDisabled}
            >
              {FACILITY_TYPES.map((o) => (
                <MenuItem key={o.value || "empty"} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Body of water"
              fullWidth
              value={bodyOfWater}
              onChange={(e) => setBodyOfWater(e.target.value)}
              disabled={formDisabled}
            >
              {BODY_TYPES.map((o) => (
                <MenuItem key={o.value || "empty-b"} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Size / volume"
            fullWidth
            value={sizeNotes}
            onChange={(e) => setSizeNotes(e.target.value)}
            placeholder="e.g. 150,000 gal main pool + 1,200 gal spa"
            disabled={formDisabled}
          />
          <TextField
            label="Equipment (pumps, heaters, DE filter…)"
            fullWidth
            multiline
            minRows={2}
            value={equipmentNotes}
            onChange={(e) => setEquipmentNotes(e.target.value)}
            placeholder="What runs the pool today? Single-speed pump, gas heater, etc."
            disabled={formDisabled}
          />
          <TextField
            label="Operating schedule"
            fullWidth
            multiline
            minRows={2}
            value={scheduleNotes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            placeholder="e.g. Pump 12h/day summer, heater 68°F in season"
            disabled={formDisabled}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          {canInteract ? (
            <Button
              variant="contained"
              onClick={runAudit}
              disabled={formDisabled || !facilityName.trim()}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BoltOutlinedIcon />}
              sx={{ minHeight: 48, alignSelf: "flex-start", ...communityContainedButtonSx() }}
            >
              {loading ? "Preparing your report…" : "Generate energy audit"}
            </Button>
          ) : null}

          <Typography variant="caption" color="text.secondary" display="block">
            For planning purposes only — not a substitute for an on-site professional audit. Limit:{" "}
            {COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT} audits per signed-in account per day.
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
