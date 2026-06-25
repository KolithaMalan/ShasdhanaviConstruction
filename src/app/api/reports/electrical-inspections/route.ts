import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const format = parseFormat(req);

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  await connectDB();
  const docs = await ElectricalEquipmentModel.find({
    inspectedAt: { $gte: start, $lte: end },
    inspectionStatus: { $in: ["PASSED", "FAILED"] },
  }).sort({ inspectedAt: -1 }).lean();

  const rows: ReportRow[] = docs.map((d, i) => ({
    no: i + 1,
    equipmentId: d.equipmentId,
    tool: d.toolName,
    contractor: d.companyName,
    category: d.category || "—",
    result: d.inspectionStatus,
    inspector: d.inspectorName,
    inspectedAt: d.inspectedAt ? new Date(d.inspectedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—",
    nextDue: d.nextInspectionDue ? new Date(d.nextInspectionDue).toLocaleDateString("en-GB") : "—",
  }));

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Electrical Inspections · ${rows.length} rows`,
    request: req,
  });

  return respondReport({
    title: "Electrical Inspection Report",
    subtitle: `${start.toLocaleDateString("en-GB")} → ${end.toLocaleDateString("en-GB")}`,
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",            key: "no",          width: "4%",  align: "right" },
      { header: "Equipment ID", key: "equipmentId", width: "15%", mono: true },
      { header: "Tool",         key: "tool",        width: "20%" },
      { header: "Contractor",   key: "contractor",  width: "18%" },
      { header: "Category",     key: "category",    width: "12%" },
      { header: "Result",       key: "result",      width: "8%" },
      { header: "Inspector",    key: "inspector",   width: "11%" },
      { header: "Inspected",    key: "inspectedAt", width: "7%" },
      { header: "Next Due",     key: "nextDue",     width: "5%" },
    ],
    rows,
    summary: [
      { label: "Total",  value: rows.length },
      { label: "Passed", value: rows.filter((r) => r.result === "PASSED").length },
      { label: "Failed", value: rows.filter((r) => r.result === "FAILED").length },
    ],
    orientation: "landscape",
    sheetName: "Electrical Inspections",
  }, format);
}
