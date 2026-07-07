import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SAGE = "#A1C2BD";
const MINT = "#E7F2EF";
const SLATE = "#708993";

interface MovementRow {
  date: string;
  time: string;
  direction: "IN" | "OUT";
  toolType: "ELECTRICAL" | "NON_ELECTRICAL";
  toolName: string;
  toolIdentifier: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  gatePassId: string;
  officer: string;
  notes: string;
}

interface Props {
  companyName: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  rows: MovementRow[];
}

Font.registerHyphenationCallback((w) => [w]);

const styles = StyleSheet.create({
  page: { padding: 30, color: NAVY, fontFamily: "Helvetica", fontSize: 9 },
  headerBar: { padding: 12, backgroundColor: OCEAN, color: "#FFFFF0", borderRadius: 6, marginBottom: 12 },
  brand: { fontSize: 8, letterSpacing: 2, textTransform: "uppercase" },
  title: { fontSize: 14, marginTop: 3, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 8, marginTop: 3 },

  summary: { border: `1pt solid ${SAGE}`, backgroundColor: MINT, borderRadius: 6, padding: 10, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 7, color: SLATE, letterSpacing: 1, textTransform: "uppercase" },
  summaryValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 1 },

  tableHeader: { flexDirection: "row", backgroundColor: NAVY, color: "#FFFFF0", paddingVertical: 5, paddingHorizontal: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: SAGE, paddingVertical: 4, paddingHorizontal: 6 },
  cellDate: { width: "9%" },
  cellTime: { width: "7%" },
  cellDir: { width: "6%" },
  cellTool: { width: "23%" },
  cellId: { width: "15%" },
  cellQty: { width: "7%", textAlign: "right" },
  cellBal: { width: "10%", textAlign: "right" },
  cellGp: { width: "13%" },
  cellOfc: { width: "10%" },

  footer: { position: "absolute", bottom: 18, left: 30, right: 30, fontSize: 7, color: SLATE, textAlign: "center" },
});

export function ToolMovementReportPdf({ companyName, startDate, endDate, generatedAt, rows }: Props) {
  const totalIn  = rows.filter((r) => r.direction === "IN").reduce((s, r) => s + r.quantity, 0);
  const totalOut = rows.filter((r) => r.direction === "OUT").reduce((s, r) => s + r.quantity, 0);

  return (
    <Document title={`Tool-Movements-${companyName}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.brand}>SAHASDHANAVI CONSTRUCTION</Text>
          <Text style={styles.title}>Tool Movement Report</Text>
          <Text style={styles.meta}>
            {companyName} · {startDate} → {endDate} · Generated {generatedAt}
          </Text>
        </View>

        <View style={styles.summary}>
          <View><Text style={styles.summaryLabel}>Total Movements</Text><Text style={styles.summaryValue}>{rows.length}</Text></View>
          <View><Text style={styles.summaryLabel}>Total Quantity IN</Text><Text style={styles.summaryValue}>{totalIn}</Text></View>
          <View><Text style={styles.summaryLabel}>Total Quantity OUT</Text><Text style={styles.summaryValue}>{totalOut}</Text></View>
          <View><Text style={styles.summaryLabel}>Net Change</Text><Text style={styles.summaryValue}>{totalIn - totalOut}</Text></View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.cellDate}>Date</Text>
          <Text style={styles.cellTime}>Time</Text>
          <Text style={styles.cellDir}>Dir</Text>
          <Text style={styles.cellTool}>Tool</Text>
          <Text style={styles.cellId}>ID</Text>
          <Text style={styles.cellQty}>Qty</Text>
          <Text style={styles.cellBal}>Bal. After</Text>
          <Text style={styles.cellGp}>Gate Pass</Text>
          <Text style={styles.cellOfc}>Officer</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={styles.cellDate}>{r.date}</Text>
            <Text style={styles.cellTime}>{r.time}</Text>
            <Text style={[styles.cellDir, { color: r.direction === "IN" ? "#15803D" : "#991B1B", fontFamily: "Helvetica-Bold" }]}>{r.direction}</Text>
            <Text style={styles.cellTool}>{r.toolName}</Text>
            <Text style={[styles.cellId, { fontFamily: "Courier" }]}>{r.toolIdentifier}</Text>
            <Text style={styles.cellQty}>{r.quantity}</Text>
            <Text style={styles.cellBal}>{r.balanceAfter}</Text>
            <Text style={styles.cellGp}>{r.gatePassId}</Text>
            <Text style={styles.cellOfc}>{r.officer}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) =>
          `Sahasdhanavi Construction · Tool Movement Report · Page ${pageNumber}/${totalPages}`
        } />
      </Page>
    </Document>
  );
}
