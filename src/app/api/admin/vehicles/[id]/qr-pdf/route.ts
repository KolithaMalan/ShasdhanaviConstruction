import mongoose from "mongoose";
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { VehicleModel } from "@/models/Vehicle";
import { qrPngDataUrl } from "@/lib/qr";
import { requireRole, jsonError } from "@/lib/api";

export const runtime = "nodejs";

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SKY = "#7FC7D9";
const MINT = "#E7F2EF";

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: "#FFFFF0", color: NAVY, fontFamily: "Helvetica" },
  header: { padding: 16, backgroundColor: OCEAN, borderRadius: 8, marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandKicker: { color: "#FFFFFFB0", fontSize: 8, letterSpacing: 2, textTransform: "uppercase" },
  brandName: { color: "#FFFFFF", fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 3 },
  accentLine: { height: 3, backgroundColor: SKY, marginBottom: 14 },

  card: { border: `1pt solid ${NAVY}22`, borderRadius: 8, backgroundColor: "#FFFFFF", padding: 16, marginBottom: 14, flexDirection: "row", gap: 16 },
  cardLeft: { flex: 1 },
  cardRight: { width: 220, height: 220, borderRadius: 6, backgroundColor: "#FFFFFF", padding: 6, border: `1pt solid ${NAVY}33` },

  vehicleNumber: { fontSize: 38, fontFamily: "Helvetica-Bold", color: NAVY },
  metaLabel: { fontSize: 8, color: NAVY + "99", letterSpacing: 1, marginTop: 14 },
  metaValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 2 },

  noticeBox: { backgroundColor: MINT, border: `1pt solid ${NAVY}22`, borderRadius: 6, padding: 12, marginTop: 4 },
  noticeTitle: { fontSize: 9, color: OCEAN, letterSpacing: 1.4, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  noticeText: { fontSize: 10, marginTop: 5, lineHeight: 1.4 },

  footer: { position: "absolute", left: 28, right: 28, bottom: 20, fontSize: 8, color: NAVY + "80", textAlign: "center" },
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const v = await VehicleModel.findById(id).lean();
  if (!v) return jsonError("Not found", 404);

  const qrDataUrl = await qrPngDataUrl(v.qrCodeData, 720);

  const element = React.createElement(
    Document,
    { title: `Vehicle-${v.vehicleNumber}` },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          {},
          React.createElement(Text, { style: styles.brandKicker }, "SAHASDHANAVI CONSTRUCTION"),
          React.createElement(Text, { style: styles.brandName }, "Vehicle Site Pass"),
        ),
        React.createElement(Text, { style: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 12 } }, v.companyName ?? ""),
      ),
      React.createElement(View, { style: styles.accentLine }),
      React.createElement(
        View,
        { style: styles.card },
        React.createElement(
          View,
          { style: styles.cardLeft },
          React.createElement(Text, { style: styles.metaLabel }, "VEHICLE NUMBER"),
          React.createElement(Text, { style: styles.vehicleNumber }, v.vehicleNumber),
          React.createElement(Text, { style: styles.metaLabel }, "TYPE"),
          React.createElement(Text, { style: styles.metaValue }, v.vehicleType),
          React.createElement(Text, { style: styles.metaLabel }, "COLOUR"),
          React.createElement(Text, { style: styles.metaValue }, v.vehicleColour ?? "—"),
          React.createElement(Text, { style: styles.metaLabel }, "PURPOSE"),
          React.createElement(Text, { style: styles.metaValue }, v.vehiclePurpose ?? "—"),
          React.createElement(Text, { style: styles.metaLabel }, "QR ID"),
          React.createElement(Text, { style: { ...styles.metaValue, fontFamily: "Courier-Bold" } }, v.vehicleQrId),
        ),
        React.createElement(
          View,
          { style: styles.cardRight },
          React.createElement(Image, { src: qrDataUrl, style: { width: "100%", height: "100%" } }),
        ),
      ),
      React.createElement(
        View,
        { style: styles.noticeBox },
        React.createElement(Text, { style: styles.noticeTitle }, "GATE INSTRUCTIONS"),
        React.createElement(Text, { style: styles.noticeText },
          "1. Affix this QR pass to the windscreen, driver side.\n" +
          "2. Present to security officer at the main gate for scan on entry and exit.\n" +
          "3. This pass is the property of Sahasdhanavi Construction (Pvt) Ltd.\n" +
          "4. Misuse or transfer will result in immediate site-access revocation.",
        ),
      ),
      React.createElement(Text, { style: styles.footer, fixed: true },
        `Sahasdhanavi Construction Security System · vehicle pass · generated ${new Date().toLocaleString("en-GB")}`,
      ),
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vehicle-${v.vehicleNumber.replace(/\s+/g, "-")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
