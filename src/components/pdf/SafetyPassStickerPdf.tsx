import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import type { SerializedElectricalEquipment } from "@/lib/tools";

interface Props {
  equipment: SerializedElectricalEquipment;
}

const NAVY = "#19183B";
const GREEN = "#16A34A";
const GREEN_DEEP = "#15803D";
const MINT = "#E7F2EF";

/* A6 portrait so it pairs nicely with the QR sticker. */
const styles = StyleSheet.create({
  page: { padding: 14, backgroundColor: "#FFFFF0", fontFamily: "Helvetica", color: NAVY },
  card: { height: "100%", borderRadius: 10, border: `1.5pt solid ${GREEN}55`, overflow: "hidden" },

  headerBand: {
    backgroundColor: GREEN, paddingVertical: 18, paddingHorizontal: 14,
    alignItems: "center",
  },
  tick: { color: "#FFFFFF", fontSize: 36, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  passedText: {
    marginTop: 6, color: "#FFFFFF", fontSize: 22,
    fontFamily: "Helvetica-Bold", letterSpacing: 6,
  },
  underHeader: { height: 4, backgroundColor: GREEN_DEEP },

  body: { padding: 14, flexGrow: 1 },

  toolName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  eid: { marginTop: 2, fontFamily: "Courier-Bold", fontSize: 10, color: NAVY + "99" },

  metaGrid: { marginTop: 10, gap: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 7, color: NAVY + "99", letterSpacing: 1, textTransform: "uppercase" },
  metaValue: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 },

  noticeBox: { marginTop: 12, padding: 8, backgroundColor: MINT, borderRadius: 4 },
  noticeTitle: { fontSize: 7, color: GREEN_DEEP, letterSpacing: 1.3, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  noticeText: { fontSize: 8, marginTop: 3, lineHeight: 1.4, color: NAVY },

  footer: { position: "absolute", left: 14, right: 14, bottom: 12,
    textAlign: "center", fontSize: 7, color: NAVY + "80" },
});

export function SafetyPassStickerPdf({ equipment }: Props) {
  const inspected = equipment.inspectedAt ? new Date(equipment.inspectedAt).toLocaleDateString("en-GB") : "—";
  const valid = equipment.nextInspectionDue ? new Date(equipment.nextInspectionDue).toLocaleDateString("en-GB") : "—";
  return (
    <Document title={`Safety-${equipment.equipmentId}`}>
      <Page size="A6" orientation="portrait" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.headerBand}>
            <Text style={styles.tick}>✓</Text>
            <Text style={styles.passedText}>PASSED</Text>
          </View>
          <View style={styles.underHeader} />

          <View style={styles.body}>
            <Text style={styles.toolName}>{equipment.toolName}</Text>
            <Text style={styles.eid}>{equipment.equipmentId}</Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Inspected</Text>
                  <Text style={styles.metaValue}>{inspected}</Text>
                </View>
                <View>
                  <Text style={styles.metaLabel}>Next Due</Text>
                  <Text style={styles.metaValue}>{valid}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Inspector</Text>
                  <Text style={styles.metaValue}>{equipment.inspectorName || "—"}</Text>
                </View>
                <View>
                  <Text style={styles.metaLabel}>Contractor</Text>
                  <Text style={styles.metaValue}>{equipment.companyName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>HSEQ ELECTRICAL CLEARANCE</Text>
              <Text style={styles.noticeText}>
                This item has passed Shasdhanavi HSEQ electrical inspection and is approved for site use until the next-due date.
                Re-inspection required after expiry.
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>
            Shasdhanavi Construction · Electrical Safety Pass
          </Text>
        </View>
      </Page>
    </Document>
  );
}
