import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { EnergyAuditReportDocument } from "@/components/energy-audit/EnergyAuditReportDocument";
import {
  energyAuditPdfFilename,
  parseEnergyAuditMarkdown,
} from "@/lib/energy-audit/parseEnergyAuditMarkdown";
import { energyAuditPdfExportSchema } from "@/lib/validations/communityEnergyAudit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = energyAuditPdfExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
  }

  const sections = parseEnergyAuditMarkdown(parsed.data.report);
  if (sections.length === 0) {
    return NextResponse.json({ error: "Report has no content to export." }, { status: 400 });
  }

  const generatedAt = parsed.data.generatedAt ?? new Date().toISOString();
  const facilityTitle = parsed.data.title.replace(/\s*—\s*energy audit$/i, "").trim() || parsed.data.title;

  const buffer = await renderToBuffer(
    <EnergyAuditReportDocument
      facilityTitle={facilityTitle}
      generatedAt={generatedAt}
      sections={sections}
    />,
  );

  const filename = energyAuditPdfFilename(facilityTitle);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
