/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document, Page, Text, View, Image, StyleSheet,
} from "@react-pdf/renderer";

import type { SerializedElectricalEquipment } from "@/lib/tools";

interface Props {
  equipment: SerializedElectricalEquipment;
  qrDataUrl: string;
}

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SKY = "#7FC7D9";
const MINT = "#E7F2EF";

/* A6 portrait = 105mm x 148mm. Render the sticker as one full A6 page. */
const styles = StyleSheet.create({
  page: { padding: 14, backgroundColor: "#FFFFF0", fontFamily: "Helvetica", color: NAVY },
  card: { border: `1.5pt solid ${NAVY}33`, borderRadius: 10, padding: 14, height: "100%" },
  header: {
    paddingVertical: 8, paddingHorizontal: 10,
    backgroundColor: OCEAN, borderRadius: 6,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { color: "#FFFFFF" },
  brandKicker: { fontSize: 6, letterSpacing: 1.4, opacity: 0.85 },
  brandName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
  accent: { height: 2, backgroundColor: SKY },

  qrWrap: {
    marginTop: 12, alignItems: "center",
  },
  qrBox: {
    width: 140, height: 140, padding: 4,
    backgroundColor: "#FFFFFF", border: `1pt solid ${NAVY}22`, borderRadius: 6,
  },

  eid: {
    marginTop: 8, textAlign: "center",
    fontFamily: "Courier-Bold", fontSize: 12, color: NAVY, letterSpacing: 1,
  },
  toolName: { marginTop: 4, textAlign: "center", fontSize: 11, fontFamily: "Helvetica-Bold" },
  contractor: { marginTop: 1, textAlign: "center", fontSize: 8, color: NAVY + "99" },

  metaCard: {
    marginTop: 10, padding: 8, backgroundColor: MINT,
    border: `0.5pt solid ${NAVY}22`, borderRadius: 4,
    flexDirection: "row", justifyContent: "space-between",
  },
  metaLabel: { fontSize: 6, color: NAVY + "99", letterSpacing: 1, textTransform: "uppercase" },
  metaValue: { fontSize: 8, fontFamily: "Helvetica-Bold", marginTop: 1 },

  footer: { position: "absolute", left: 14, right: 14, bottom: 14, textAlign: "center",
    fontSize: 7, color: NAVY + "80" },
});

export function QrStickerPdf({ equipment, qrDataUrl }: Props) {
  const inspected = equipment.inspectedAt ? new Date(equipment.inspectedAt).toLocaleDateString("en-GB") : "—";
  const valid = equipment.nextInspectionDue ? new Date(equipment.nextInspectionDue).toLocaleDateString("en-GB") : "—";

  return (
    <Document title={`Sticker-${equipment.equipmentId}`}>
      <Page size="A6" orientation="portrait" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <Text style={styles.brandKicker}>SHASDHANAVI CONSTRUCTION</Text>
              <Text style={styles.brandName}>Electrical QR Pass</Text>
            </View>
          </View>
          <View style={styles.accent} />

          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <Image src={qrDataUrl} style={{ width: "100%", height: "100%" }} />
            </View>
            <Text style={styles.eid}>{equipment.equipmentId}</Text>
            <Text style={styles.toolName}>{equipment.toolName}</Text>
            <Text style={styles.contractor}>{equipment.companyName}</Text>
          </View>

          <View style={styles.metaCard}>
            <View>
              <Text style={styles.metaLabel}>INSPECTED</Text>
              <Text style={styles.metaValue}>{inspected}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>VALID UNTIL</Text>
              <Text style={styles.metaValue}>{valid}</Text>
            </View>
          </View>

          <Text style={styles.footer}>Scan at gate · Property of Shasdhanavi Construction</Text>
        </View>
      </Page>
    </Document>
  );
}
