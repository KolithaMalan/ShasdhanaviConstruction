/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document, Page, Text, View, Image, StyleSheet,
} from "@react-pdf/renderer";

import type { MaterialsItem } from "@/lib/materialsPass";

interface Props {
  companyName: string;
  downloadDate: string;
  items: MaterialsItem[];
  qrDataUrl: string;
  logoDataUrl: string;
  serialNo?: string;
}

const BLACK = "#111111";
const LINE = "#000000";

/** Minimum number of table rows so the printed form keeps its familiar look. */
const MIN_ROWS = 28;

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 46, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: BLACK },

  /* Top header — 3-cell bordered table */
  headerTable: { flexDirection: "row", borderWidth: 1, borderColor: LINE },
  headerLogoCell: {
    width: "34%", borderRightWidth: 1, borderColor: LINE,
    padding: 8, alignItems: "center", justifyContent: "center",
  },
  headerTitleCell: {
    width: "42%", borderRightWidth: 1, borderColor: LINE,
    padding: 8, alignItems: "center", justifyContent: "center",
  },
  headerSerialCell: { width: "24%", padding: 8, justifyContent: "center" },
  logo: { width: 120, height: 40, objectFit: "contain" },
  headerTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "center" },
  serialLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  serialValue: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 6 },

  /* Banner row with QR */
  bannerRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  bannerBox: {
    flex: 1, borderWidth: 1, borderColor: LINE, padding: 10,
    minHeight: 64, justifyContent: "center",
  },
  bannerText: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "center" },
  qrBox: { width: 64, height: 64, marginLeft: 10 },
  qr: { width: "100%", height: "100%" },

  /* Meta line */
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  metaText: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  /* IN / OUT block */
  infoTable: { marginTop: 10, borderWidth: 1, borderColor: LINE },
  infoRow: { flexDirection: "row" },
  infoCellLeft: {
    width: "50%", borderRightWidth: 1, borderColor: LINE,
    paddingVertical: 5, paddingHorizontal: 8,
  },
  infoCellRight: { width: "50%", paddingVertical: 5, paddingHorizontal: 8 },
  infoBorderBottom: { borderBottomWidth: 1, borderColor: LINE },
  infoLabel: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },

  /* Items table */
  itemsTable: { marginTop: 10, borderWidth: 1, borderColor: LINE },
  thRow: { flexDirection: "row", backgroundColor: "#FFFFFF" },
  tdRow: { flexDirection: "row" },
  cNo: { width: "10%", borderRightWidth: 1, borderColor: LINE, paddingVertical: 5, paddingHorizontal: 4, textAlign: "center" },
  cItem: { width: "48%", borderRightWidth: 1, borderColor: LINE, paddingVertical: 5, paddingHorizontal: 6 },
  cQty: { width: "20%", borderRightWidth: 1, borderColor: LINE, paddingVertical: 5, paddingHorizontal: 6, textAlign: "center" },
  cRemark: { width: "22%", paddingVertical: 5, paddingHorizontal: 6 },
  cellBorderBottom: { borderBottomWidth: 1, borderColor: LINE },
  thText: { fontSize: 10, fontFamily: "Helvetica-Bold", textAlign: "center" },
  rowMinH: { minHeight: 16 },

  /* Signatures */
  signRow: { flexDirection: "row", marginTop: 26 },
  signCell: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  signLine: { fontSize: 9 },
  signLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 2, textAlign: "center" },
  signSub: { fontSize: 8, textAlign: "center" },

  /* Fixed footer */
  footer: {
    position: "absolute", bottom: 18, left: 32, right: 32,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderColor: LINE, paddingTop: 6,
  },
  footerText: { fontSize: 9, fontFamily: "Helvetica-Bold" },
});

function HeaderBlock({ logoDataUrl, serialNo }: { logoDataUrl: string; serialNo: string }) {
  return (
    <View style={styles.headerTable}>
      <View style={styles.headerLogoCell}>
        {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : <Text>Lakdhanavi Limited</Text>}
      </View>
      <View style={styles.headerTitleCell}>
        <Text style={styles.headerTitle}>MATERIAL IN &amp;{"\n"}OUT RECORDS</Text>
      </View>
      <View style={styles.headerSerialCell}>
        <Text style={styles.serialLabel}>Serial No:</Text>
        <Text style={styles.serialValue}>{serialNo}</Text>
      </View>
    </View>
  );
}

export function MaterialsRecordPdf({
  companyName, downloadDate, items, qrDataUrl, logoDataUrl,
  serialNo = "L272-HSEQ-COR-",
}: Props) {
  const padded: (MaterialsItem | null)[] = [...items];
  while (padded.length < MIN_ROWS) padded.push(null);

  return (
    <Document title="Material In & Out Records">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <HeaderBlock logoDataUrl={logoDataUrl} serialNo={serialNo} />

        {/* Banner + QR */}
        <View style={styles.bannerRow}>
          <View style={styles.bannerBox}>
            <Text style={styles.bannerText}>
              SAHASDHANAVI 350MW CCPP CONTRACTORS MATERIALS IN / OUT RECORDS
            </Text>
          </View>
          <View style={styles.qrBox}>
            <Image src={qrDataUrl} style={styles.qr} />
          </View>
        </View>

        {/* Contractor + download date */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Contractor Name: {companyName || "—"}</Text>
          <Text style={styles.metaText}>Equipment Download Date- {downloadDate}</Text>
        </View>

        {/* IN / OUT / Date / Gate pass */}
        <View style={styles.infoTable}>
          <View style={[styles.infoRow, styles.infoBorderBottom]}>
            <View style={styles.infoCellLeft}><Text style={styles.infoLabel}>IN: -</Text></View>
            <View style={styles.infoCellRight}><Text style={styles.infoLabel}>Date: -</Text></View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCellLeft}><Text style={styles.infoLabel}>OUT: -</Text></View>
            <View style={styles.infoCellRight}><Text style={styles.infoLabel}>Gate pass no: -</Text></View>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.itemsTable}>
          <View style={[styles.thRow, styles.cellBorderBottom]} fixed>
            <View style={styles.cNo}><Text style={styles.thText}>No:</Text></View>
            <View style={styles.cItem}><Text style={styles.thText}>Item</Text></View>
            <View style={styles.cQty}><Text style={styles.thText}>Quantity</Text></View>
            <View style={styles.cRemark}><Text style={styles.thText}>Remark</Text></View>
          </View>
          {padded.map((row, i) => (
            <View
              key={i}
              style={[styles.tdRow, styles.rowMinH, i < padded.length - 1 ? styles.cellBorderBottom : {}]}
              wrap={false}
            >
              <View style={styles.cNo}><Text>{row ? String(row.no) : ""}</Text></View>
              <View style={styles.cItem}><Text>{row ? row.item : ""}</Text></View>
              <View style={styles.cQty}><Text>{row ? row.quantity : ""}</Text></View>
              <View style={styles.cRemark}><Text>{row ? row.remark : ""}</Text></View>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={styles.signRow} wrap={false}>
          <View style={styles.signCell}>
            <Text style={styles.signLine}>……………………………………</Text>
            <Text style={styles.signLabel}>SECURITY OFFICER</Text>
          </View>
          <View style={styles.signCell}>
            <Text style={styles.signLine}>……………………………………</Text>
            <Text style={styles.signLabel}>LAK ISO VERIFICATION</Text>
          </View>
          <View style={styles.signCell}>
            <Text style={styles.signLine}>……………………………………</Text>
            <Text style={styles.signLabel}>PROCESS ENGINEER</Text>
            <Text style={styles.signSub}>(DESIGNATION &amp; SIGN)</Text>
          </View>
        </View>

        {/* Fixed footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Revision: 00/ 19-06-2026</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
