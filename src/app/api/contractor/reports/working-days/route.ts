import {
  Document, Page, Text, View, StyleSheet, renderToBuffer, Font,
} from "@react-pdf/renderer";
import React from "react";

import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { EmployeeModel } from "@/models/Employee";
import { MovementLogModel } from "@/models/MovementLog";
import { localDateKey } from "@/lib/working-days";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

const NAVY = "#19183B";
const OCEAN = "#146C94";
const SAGE = "#A1C2BD";
const MINT = "#E7F2EF";
const SLATE = "#708993";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: NAVY, fontFamily: "Helvetica" },
  headerBar: { padding: 14, backgroundColor: OCEAN, color: "#FFFFF0", borderRadius: 6, marginBottom: 16 },
  brand: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase" },
  title: { fontSize: 14, marginTop: 4, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, marginTop: 4 },

  card: { border: `1pt solid ${SAGE}`, borderRadius: 6, padding: 12, marginBottom: 12, backgroundColor: MINT },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 9, color: SLATE },
  cardValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },

  tableHeader: { flexDirection: "row", backgroundColor: NAVY, color: "#FFFFF0", paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: SAGE, paddingVertical: 5, paddingHorizontal: 8 },
  cellSm: { width: "6%" },
  cellLg: { width: "26%" },
  cellNic: { width: "18%" },
  cellMd: { width: "16%" },
  cellNum: { width: "10%", textAlign: "right" },

  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: SLATE, textAlign: "center" },
});

Font.registerHyphenationCallback((w) => [w]);

export async function GET(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startParam ? new Date(startParam) : defaultStart;
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  await connectDB();
  const user = await UserModel.findById(guard.session.user.id).lean();
  const employees = await EmployeeModel.find({ contractorId: guard.session.user.id }).lean();

  const scans = await MovementLogModel.find({
    entityType: "EMPLOYEE",
    contractorId: guard.session.user.id,
    direction: "IN",
    scannedAt: { $gte: start, $lte: end },
  })
    .select("employeeId scannedAt")
    .lean();

  const daysByEmployee = new Map<string, Set<string>>();
  for (const s of scans) {
    if (!s.employeeId) continue;
    const key = String(s.employeeId);
    const set = daysByEmployee.get(key) ?? new Set<string>();
    set.add(localDateKey(s.scannedAt));
    daysByEmployee.set(key, set);
  }

  const rows = employees.map((e, idx) => ({
    no: idx + 1,
    name: e.name,
    nic: e.nicNumber,
    trade: e.tradeType,
    employeeId: e.employeeId ?? "—",
    days: daysByEmployee.get(String(e._id))?.size ?? 0,
  }));

  const totalWorkingDays = rows.reduce((sum, r) => sum + r.days, 0);

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.headerBar },
        React.createElement(Text, { style: styles.brand }, "SAHASDHANAVI CONSTRUCTION"),
        React.createElement(Text, { style: styles.title }, "Workforce Working-Days Report"),
        React.createElement(Text, { style: styles.meta },
          `${user?.companyName ?? user?.name ?? ""}  ·  ${start.toLocaleDateString("en-GB")} → ${end.toLocaleDateString("en-GB")}  ·  Generated ${now.toLocaleString("en-GB")}`),
      ),
      React.createElement(
        View,
        { style: styles.card },
        React.createElement(
          View,
          { style: styles.cardRow },
          React.createElement(View, {},
            React.createElement(Text, { style: styles.cardLabel }, "Company"),
            React.createElement(Text, { style: styles.cardValue }, user?.companyName ?? user?.name ?? "—"),
          ),
          React.createElement(View, {},
            React.createElement(Text, { style: styles.cardLabel }, "Employees"),
            React.createElement(Text, { style: styles.cardValue }, String(rows.length)),
          ),
          React.createElement(View, {},
            React.createElement(Text, { style: styles.cardLabel }, "Total Working Days"),
            React.createElement(Text, { style: styles.cardValue }, String(totalWorkingDays)),
          ),
          React.createElement(View, {},
            React.createElement(Text, { style: styles.cardLabel }, "Method"),
            React.createElement(Text, { style: styles.cardValue }, "Unique days IN"),
          ),
        ),
      ),
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.cellSm }, "#"),
        React.createElement(Text, { style: styles.cellLg }, "Name"),
        React.createElement(Text, { style: styles.cellNic }, "NIC"),
        React.createElement(Text, { style: styles.cellMd }, "Trade"),
        React.createElement(Text, { style: styles.cellMd }, "Employee ID"),
        React.createElement(Text, { style: styles.cellNum }, "Days"),
      ),
      ...rows.map((r) =>
        React.createElement(
          View, { key: r.no, style: styles.tableRow },
          React.createElement(Text, { style: styles.cellSm }, String(r.no)),
          React.createElement(Text, { style: styles.cellLg }, r.name),
          React.createElement(Text, { style: styles.cellNic }, r.nic),
          React.createElement(Text, { style: styles.cellMd }, r.trade),
          React.createElement(Text, { style: styles.cellMd }, r.employeeId),
          React.createElement(Text, { style: styles.cellNum }, String(r.days)),
        ),
      ),
      React.createElement(
        Text, { style: styles.footer, fixed: true },
        "Sahasdhanavi Construction Security System — Working-days based on actual gate IN scans",
      ),
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any);
  const filename = `working-days-${(user?.companyName ?? "report").replace(/\s+/g, "-").toLowerCase()}-${now.toISOString().slice(0, 10)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
