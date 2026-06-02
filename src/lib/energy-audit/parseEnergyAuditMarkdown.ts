export type EnergyAuditSection = {
  heading: string;
  body: string;
};

/** Split markdown energy audit reports into ## sections for display and PDF export. */
export function parseEnergyAuditMarkdown(content: string): EnergyAuditSection[] {
  const blocks = content.split(/\n(?=## )/);
  return blocks
    .map((block) => {
      const lines = block.trim().split("\n");
      const heading = lines[0]?.startsWith("## ") ? lines[0].replace(/^##\s*/, "").trim() : "";
      const body = heading ? lines.slice(1).join("\n").trim() : block.trim();
      const cleanBody = body.replace(/^#+\s*/gm, "").replace(/\*\*/g, "");
      return { heading, body: cleanBody };
    })
    .filter((s) => s.heading || s.body);
}

export function energyAuditPdfFilename(title: string): string {
  const base =
    title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "facility";
  return `${base}-energy-audit.pdf`;
}
