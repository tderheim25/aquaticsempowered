import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 8, fontWeight: 700 },
  subtitle: { fontSize: 11, marginBottom: 16, color: "#475569" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  header: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#003B6F", paddingBottom: 6, marginBottom: 4, fontWeight: 700 },
  cell: { flex: 1, paddingRight: 4 },
  cellWide: { flex: 1.4, paddingRight: 4 },
});

export type ReportLogRow = {
  logged_at: string;
  pool_name: string;
  ph: number | null;
  free_chlorine: number | null;
  total_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  langelier_saturation_index: number | null;
};

export function ChemicalReportDocument({
  orgName,
  monthLabel,
  rows,
}: {
  orgName: string;
  monthLabel: string;
  rows: ReportLogRow[];
}) {
  const fmt = (v: number | null) => (v == null ? "—" : String(v));
  const fmtDate = (iso: string) => new Date(iso).toLocaleString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Chemistry report — {orgName}</Text>
        <Text style={styles.subtitle}>{monthLabel} · {rows.length} readings</Text>
        <View style={styles.header}>
          <Text style={styles.cellWide}>Logged</Text>
          <Text style={styles.cell}>Pool</Text>
          <Text style={styles.cell}>pH</Text>
          <Text style={styles.cell}>FC</Text>
          <Text style={styles.cell}>TC</Text>
          <Text style={styles.cell}>Alk</Text>
          <Text style={styles.cell}>Temp</Text>
          <Text style={styles.cell}>LSI</Text>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cellWide}>{fmtDate(row.logged_at)}</Text>
            <Text style={styles.cell}>{row.pool_name}</Text>
            <Text style={styles.cell}>{fmt(row.ph)}</Text>
            <Text style={styles.cell}>{fmt(row.free_chlorine)}</Text>
            <Text style={styles.cell}>{fmt(row.total_chlorine)}</Text>
            <Text style={styles.cell}>{fmt(row.alkalinity)}</Text>
            <Text style={styles.cell}>{fmt(row.temp_f)}</Text>
            <Text style={styles.cell}>{fmt(row.langelier_saturation_index)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
