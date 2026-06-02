import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { EnergyAuditSection } from "@/lib/energy-audit/parseEnergyAuditMarkdown";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.45 },
  brand: { fontSize: 9, color: "#64748b", marginBottom: 6 },
  title: { fontSize: 17, fontWeight: 700, marginBottom: 4, color: "#003B6F" },
  meta: { fontSize: 10, color: "#475569", marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 5, color: "#003B6F" },
  sectionBody: { fontSize: 10, marginBottom: 2 },
  footer: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
});

export function EnergyAuditReportDocument({
  facilityTitle,
  generatedAt,
  sections,
}: {
  facilityTitle: string;
  generatedAt: string;
  sections: EnergyAuditSection[];
}) {
  const dateLabel = new Date(generatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Aquatics Empowered</Text>
        <Text style={styles.title}>Energy audit report</Text>
        <Text style={styles.meta}>
          {facilityTitle} · Prepared {dateLabel}
        </Text>

        {sections.map((section, i) => (
          <View key={i}>
            {section.heading ? <Text style={styles.sectionTitle}>{section.heading}</Text> : null}
            {section.body ? <Text style={styles.sectionBody}>{section.body}</Text> : null}
          </View>
        ))}

        <Text style={styles.footer}>
          This report is based on information provided and is intended for planning discussions with your board or
          operator team. Validate equipment, schedules, and savings estimates with an on-site professional before
          capital decisions.
        </Text>
      </Page>
    </Document>
  );
}
