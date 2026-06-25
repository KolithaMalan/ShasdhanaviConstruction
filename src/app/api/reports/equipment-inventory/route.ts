import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { NonElectricalToolModel } from "@/models/NonElectricalTool";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const contractor = searchParams.get("contractor")?.trim();
  const format = parseFormat(req);

  const filter: Record<string, unknown> = {};
  if (contractor) filter.companyName = contractor;

  await connectDB();
  const [electrical, nonElectrical] = await Promise.all([
    ElectricalEquipmentModel.find(filter).sort({ companyName: 1, toolName: 1 }).lean(),
    NonElectricalToolModel.find(filter).sort({ companyName: 1, toolName: 1 }).lean(),
  ]);

  let no = 0;
  const rows: ReportRow[] = [
    ...electrical.map((e) => ({
      no: ++no,
      type: "Electrical",
      id: e.equipmentId,
      tool: e.toolName,
      contractor: e.companyName,
      category: e.category || "—",
      approved: e.quantity,
      balance: e.currentBalance,
      status: e.inspectionStatus,
    })),
    ...nonElectrical.map((t) => ({
      no: ++no,
      type: "Non-Electrical",
      id: t.toolId,
      tool: `${t.toolName} (${t.unit})`,
      contractor: t.companyName,
      category: t.category || "—",
      approved: t.approvedQuantity,
      balance: t.currentBalance,
      status: t.status,
    })),
  ];

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Equipment Inventory · ${rows.length} items`,
    request: req,
  });

  return respondReport({
    title: "Equipment Inventory Report",
    filters: contractor ? `Contractor: ${contractor}` : undefined,
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",          key: "no",         width: "4%",  align: "right" },
      { header: "Type",       key: "type",       width: "10%" },
      { header: "ID",         key: "id",         width: "14%", mono: true },
      { header: "Tool",       key: "tool",       width: "22%" },
      { header: "Contractor", key: "contractor", width: "20%" },
      { header: "Category",   key: "category",   width: "13%" },
      { header: "Approved",   key: "approved",   width: "7%",  align: "right" },
      { header: "Balance",    key: "balance",    width: "7%",  align: "right" },
      { header: "Status",     key: "status",     width: "13%" },
    ],
    rows,
    summary: [
      { label: "Items",          value: rows.length },
      { label: "Electrical",     value: electrical.length },
      { label: "Non-Electrical", value: nonElectrical.length },
    ],
    orientation: "landscape",
    sheetName: "Equipment Inventory",
  }, format);
}
