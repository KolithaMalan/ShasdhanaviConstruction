/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

import type { SerializedPermanentEmployee } from "@/lib/permanentEmployee";

interface Props {
  employee: SerializedPermanentEmployee;
  qrDataUrl: string;
  logoDataUrl: string;
  photoDataUrl?: string | null;
}

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SKY = "#7FC7D9";
const MUTED = "#5C5B7E";
const SOFT = "#E7F2EF";
const PARCHMENT = "#FFFFF0";
const GOLD = "#B8860B";

/* Taller-than-CR80 card so the photo, fields and QR all have room to breathe. */
const CARD_W = 300;
const CARD_H = 210;

const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    color: NAVY,
    fontFamily: "Helvetica",
    backgroundColor: PARCHMENT,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    border: `1.2pt solid ${GOLD}66`,
    overflow: "hidden",
    position: "relative",
  },

  /* Centered header band — logo above, brand + title centered */
  headerStrip: {
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoImg: { width: 28, height: 28, objectFit: "contain" },
  brandName: { color: "#FFFFFF", fontSize: 10.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, textAlign: "center" },
  brandTitle: { color: SKY, fontSize: 8, fontFamily: "Helvetica-Bold", marginTop: 2, letterSpacing: 1.2, textAlign: "center" },
  accentLine: { height: 3, backgroundColor: GOLD },

  permBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: GOLD,
    color: "#FFFFFF",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },

  body: { flexDirection: "row", padding: 12, gap: 12 },
  photoFrame: {
    width: 84,
    height: 104,
    borderRadius: 6,
    backgroundColor: SOFT,
    border: `0.8pt solid ${GOLD}55`,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoInitials: { fontSize: 30, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 1 },
  rightCol: { flex: 1 },
  name: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 8 },

  fieldRow: { marginBottom: 6 },
  fieldLabel: { fontSize: 6, color: MUTED, letterSpacing: 0.6, marginBottom: 1 },
  fieldValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY },

  /* BACK */
  backBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 22,
  },
  backQrBox: {
    width: 104,
    height: 104,
    padding: 5,
    backgroundColor: "#FFFFFF",
    border: `0.8pt solid ${NAVY}22`,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  backQrImg: { width: "100%", height: "100%", objectFit: "contain" },
  backCaption: { marginTop: 8, fontSize: 6.5, color: MUTED, letterSpacing: 0.6, textAlign: "center" },
  backId: { marginTop: 2, fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 0.5, textAlign: "center" },
  backFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: SOFT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backFooterText: { fontSize: 6, color: NAVY, letterSpacing: 0.4 },
});

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

function Header({ logoDataUrl }: { logoDataUrl: string }) {
  return (
    <>
      <View style={styles.headerStrip}>
        <View style={styles.logoBadge}>
          {logoDataUrl ? <Image src={logoDataUrl} style={styles.logoImg} /> : null}
        </View>
        <Text style={styles.brandName}>SHASDHANAVI CONSTRUCTION</Text>
        <Text style={styles.brandTitle}>Site Access Pass</Text>
      </View>
      <View style={styles.accentLine} />
    </>
  );
}

function CardFront({ employee, logoDataUrl, photoDataUrl }: Omit<Props, "qrDataUrl">) {
  return (
    <View style={styles.card}>
      <Header logoDataUrl={logoDataUrl} />
      <Text style={styles.permBadge}>PERMANENT</Text>

      <View style={styles.body}>
        <View style={styles.photoFrame}>
          {photoDataUrl ? (
            <Image src={photoDataUrl} style={styles.photoImg} />
          ) : (
            <Text style={styles.photoInitials}>{initialsFor(employee.name)}</Text>
          )}
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.name}>{employee.name}</Text>
          <Field label="PERM ID" value={employee.permanentId} />
          <Field label="NIC" value={employee.nicNumber} />
          <Field label="DESIGNATION" value={employee.designation} />
          <Field label="DEPARTMENT" value={employee.department} />
        </View>
      </View>
    </View>
  );
}

function CardBack({ employee, qrDataUrl, logoDataUrl }: Props) {
  return (
    <View style={styles.card}>
      <Header logoDataUrl={logoDataUrl} />

      <View style={styles.backBody}>
        <View style={styles.backQrBox}>
          <Image src={qrDataUrl} style={styles.backQrImg} />
        </View>
        <Text style={styles.backCaption}>SHASDHANAVI CONSTRUCTION (PVT) LTD</Text>
        <Text style={styles.backId}>{employee.permanentId}</Text>
      </View>

      <View style={styles.backFooter}>
        <Text style={styles.backFooterText}>Permanent Staff Pass · No Expiry</Text>
        <Text style={styles.backFooterText}>v1 · {new Date().getFullYear()}</Text>
      </View>
    </View>
  );
}

export function PermanentIdCardPdf({ employee, qrDataUrl, logoDataUrl, photoDataUrl }: Props) {
  return (
    <Document title={`Permanent-ID-${employee.permanentId}`}>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <CardFront employee={employee} logoDataUrl={logoDataUrl} photoDataUrl={photoDataUrl} />
      </Page>
      <Page size="A6" orientation="landscape" style={styles.page}>
        <CardBack employee={employee} qrDataUrl={qrDataUrl} logoDataUrl={logoDataUrl} />
      </Page>
    </Document>
  );
}
