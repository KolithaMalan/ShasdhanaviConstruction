/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

import type { SerializedEmployee } from "@/lib/employee";

interface Props {
  employee: SerializedEmployee;
  qrDataUrl: string;
  photoAbsoluteUrl: string | null;
}

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SKY = "#7FC7D9";
const MUTED = "#5C5B7E";
const SOFT = "#E7F2EF";
const PARCHMENT = "#FFFFF0";

/* Standard CR80 credit-card size — 85.6mm × 54mm. */
const MM = 2.83465;
const CARD_W = 85.6 * MM; // ≈ 242.6 pt
const CARD_H = 54 * MM;   // ≈ 153.1 pt

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 9,
    color: NAVY,
    fontFamily: "Helvetica",
    backgroundColor: PARCHMENT,
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    border: "1pt solid #19183B22",
    overflow: "hidden",
    position: "relative",
  },

  /* Front header band */
  headerStrip: {
    height: 26,
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  brandKicker: { color: "#FFFFFFA0", fontSize: 6, letterSpacing: 1.4 },
  brandName: { color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 },
  accentLine: { height: 2, backgroundColor: SKY },

  body: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },

  photoFrame: {
    width: 60,
    height: 76,
    borderRadius: 5,
    backgroundColor: SOFT,
    border: "0.7pt solid #19183B33",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoInitials: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1,
  },

  rightCol: { flex: 1, justifyContent: "flex-start" },
  name: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 5,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2.5,
  },
  fieldLabel: {
    width: 46,
    fontSize: 5.5,
    color: MUTED,
    letterSpacing: 0.6,
    paddingTop: 0.5,
  },
  fieldValue: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },

  footer: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  validKicker: { fontSize: 5.5, color: MUTED, letterSpacing: 0.7 },
  validValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY },
  empIdCorner: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: OCEAN,
    letterSpacing: 0.4,
  },

  /* ── BACK SIDE ─────────────────────────────────── */
  backHeader: {
    height: 22,
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingTop: 4,
    alignItems: "center",
  },
  backKicker: {
    color: "#FFFFFFA0",
    fontSize: 5.5,
    letterSpacing: 1.4,
  },
  backTitle: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },

  backBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 18,
  },
  backQrBox: {
    width: 92,
    height: 92,
    padding: 4,
    backgroundColor: "#FFFFFF",
    border: "0.7pt solid #19183B22",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  backQrImg: {
    width: "100%",
    height: "100%",
  },
  backCaption: {
    marginTop: 6,
    fontSize: 6,
    color: MUTED,
    letterSpacing: 0.6,
    textAlign: "center",
  },
  backEmpId: {
    marginTop: 2,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  backFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: SOFT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backFooterText: { fontSize: 5.5, color: NAVY, letterSpacing: 0.4 },
});

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

function initialsFor(name: string): string {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** FRONT — photo + identity + fields + valid-until footer. */
function CardFront({ employee, photoAbsoluteUrl }: Omit<Props, "qrDataUrl">) {
  const expiry = employee.idCardExpiresAt
    ? new Date(employee.idCardExpiresAt).toLocaleDateString("en-GB")
    : "—";

  return (
    <View style={styles.card}>
      <View style={styles.headerStrip}>
        <Text style={styles.brandKicker}>SHASDHANAVI CONSTRUCTION</Text>
        <Text style={styles.brandName}>Site Access Pass</Text>
      </View>
      <View style={styles.accentLine} />

      <View style={styles.body}>
        <View style={styles.photoFrame}>
          {photoAbsoluteUrl ? (
            <Image src={photoAbsoluteUrl} style={styles.photoImg} />
          ) : (
            <Text style={styles.photoInitials}>{initialsFor(employee.name)}</Text>
          )}
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.name}>{employee.name}</Text>
          <FieldRow label="EMP ID" value={employee.employeeId ?? ""} />
          <FieldRow label="NIC" value={employee.nicNumber} />
          <FieldRow label="CONTRACTOR" value={employee.companyName} />
          <FieldRow label="TRADE" value={employee.tradeType} />
          <FieldRow label="DESIGNATION" value={employee.designation || ""} />
          <FieldRow label="BLOOD" value={employee.bloodType || "Unknown"} />
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.validKicker}>VALID UNTIL</Text>
          <Text style={styles.validValue}>{expiry}</Text>
        </View>
        <Text style={styles.empIdCorner}>
          {employee.employeeId ?? employee.nicNumber}
        </Text>
      </View>
    </View>
  );
}

/** BACK — large QR code centered, brand strip on top, footer caption. */
function CardBack({ employee, qrDataUrl }: Omit<Props, "photoAbsoluteUrl">) {
  return (
    <View style={styles.card}>
      <View style={styles.backHeader}>
        <Text style={styles.backKicker}>SCAN FOR VERIFICATION</Text>
        <Text style={styles.backTitle}>Site Access QR</Text>
      </View>
      <View style={styles.accentLine} />

      <View style={styles.backBody}>
        <View style={styles.backQrBox}>
          <Image src={qrDataUrl} style={styles.backQrImg} />
        </View>
        <Text style={styles.backCaption}>SHASDHANAVI CONSTRUCTION (PVT) LTD</Text>
        <Text style={styles.backEmpId}>
          {employee.employeeId ?? employee.nicNumber}
        </Text>
      </View>

      <View style={styles.backFooter}>
        <Text style={styles.backFooterText}>Property of Shasdhanavi</Text>
        <Text style={styles.backFooterText}>
          v2 · {new Date().getFullYear()}
        </Text>
      </View>
    </View>
  );
}

/** Public alias retained for any legacy importer. */
export const IdCardFace = CardFront;

/** Single-employee, two-page ID card document (front + back). */
export function IdCardPdf({ employee, qrDataUrl, photoAbsoluteUrl }: Props) {
  return (
    <Document title={`ID-${employee.employeeId ?? employee.nicNumber}`}>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <CardFront employee={employee} photoAbsoluteUrl={photoAbsoluteUrl} />
      </Page>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <CardBack employee={employee} qrDataUrl={qrDataUrl} />
      </Page>
    </Document>
  );
}

/** Multi-employee bundle — front + back per employee, alternating pages. */
export function BulkIdCardsPdf({
  cards,
}: {
  cards: Array<Props>;
}) {
  return (
    <Document title={`ID-Cards-Bundle-${new Date().toISOString().slice(0, 10)}`}>
      {cards.flatMap((c, i) => [
        <Page key={`f-${i}`} size="A6" orientation="landscape" style={styles.page}>
          <CardFront employee={c.employee} photoAbsoluteUrl={c.photoAbsoluteUrl} />
        </Page>,
        <Page key={`b-${i}`} size="A6" orientation="landscape" style={styles.page}>
          <CardBack employee={c.employee} qrDataUrl={c.qrDataUrl} />
        </Page>,
      ])}
    </Document>
  );
}
