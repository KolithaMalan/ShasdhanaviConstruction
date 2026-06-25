import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SAGE = "#A1C2BD";
const MINT = "#E7F2EF";
const SLATE = "#708993";

export interface ReportColumn {
  header: string;
  key: string;
  width: string; // "10%", etc.
  align?: "left" | "right" | "center";
  mono?: boolean;
}

export interface ReportRow {
  [key: string]: string | number | null | undefined;
}

export interface SummaryStat {
  label: string;
  value: string | number;
}

interface Props {
  title: string;
  subtitle?: string;
  filters?: string;
  generatedBy?: string;
  generatedAt: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary?: SummaryStat[];
  orientation?: "portrait" | "landscape";
}

Font.registerHyphenationCallback((w) => [w]);

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", fontSize: 8, color: NAVY },
  headerBar: {
    padding: 12, marginBottom: 12, borderRadius: 6,
    backgroundColor: OCEAN, color: "#FFFFF0",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { fontSize: 8, letterSpacing: 1.6, textTransform: "uppercase" },
  title: { fontSize: 14, marginTop: 3, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 7, marginTop: 3, opacity: 0.9 },
  rightHeader: { textAlign: "right" },

  summary: {
    border: `1pt solid ${SAGE}`, backgroundColor: MINT, borderRadius: 5,
    padding: 8, marginBottom: 8,
    flexDirection: "row", justifyContent: "space-around", gap: 8,
  },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 6, color: SLATE, letterSpacing: 1, textTransform: "uppercase" },
  summaryValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 1 },

  tableHeader: {
    flexDirection: "row", backgroundColor: NAVY, color: "#FFFFF0",
    paddingVertical: 5, paddingHorizontal: 6,
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row", borderBottomWidth: 0.5, borderColor: SAGE,
    paddingVertical: 4, paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#F8F9FA" },

  footer: {
    position: "absolute", bottom: 14, left: 28, right: 28,
    fontSize: 7, color: SLATE, textAlign: "center",
  },
});

export function ReportPdfTemplate({
  title, subtitle, filters, generatedBy, generatedAt,
  columns, rows, summary, orientation = "portrait",
}: Props) {
  return (
    <Document title={title}>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.brand}>SHASDHANAVI CONSTRUCTION</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.meta}>{subtitle}</Text>}
            {filters && <Text style={styles.meta}>{filters}</Text>}
          </View>
          <View style={styles.rightHeader}>
            <Text style={styles.meta}>Generated</Text>
            <Text style={[styles.meta, { fontFamily: "Helvetica-Bold" }]}>{generatedAt}</Text>
            {generatedBy && <Text style={styles.meta}>by {generatedBy}</Text>}
          </View>
        </View>

        {summary && summary.length > 0 && (
          <View style={styles.summary}>
            {summary.map((s, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{s.label}</Text>
                <Text style={styles.summaryValue}>{String(s.value)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tableHeader}>
          {columns.map((c) => (
            <Text key={c.key} style={{ width: c.width, textAlign: c.align ?? "left" }}>
              {c.header}
            </Text>
          ))}
        </View>

        {rows.map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
            {columns.map((c) => {
              const val = row[c.key];
              const text = val === null || val === undefined ? "—" : String(val);
              return (
                <Text key={c.key}
                      style={{
                        width: c.width,
                        textAlign: c.align ?? "left",
                        fontFamily: c.mono ? "Courier" : "Helvetica",
                      }}>
                  {text}
                </Text>
              );
            })}
          </View>
        ))}

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) =>
          `${title} · Page ${pageNumber} of ${totalPages} · Shasdhanavi Construction Security System`
        } />
      </Page>
    </Document>
  );
}
