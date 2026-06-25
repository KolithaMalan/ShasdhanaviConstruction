import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { checkExpiredIdCards } from "@/lib/idCardChecker";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const format = parseFormat(req);

  await connectDB();
  await checkExpiredIdCards();
  const docs = await EmployeeModel.find({ status: "DEACTIVATED" }).sort({ idCardExpiresAt: -1 }).lean();

  const rows: ReportRow[] = docs.map((d, i) => ({
    no: i + 1,
    name: d.name,
    nic: d.nicNumber,
    employeeId: d.employeeId ?? "—",
    contractor: d.companyName,
    trade: d.tradeType,
    expiredOn: d.idCardExpiresAt ? new Date(d.idCardExpiresAt).toLocaleDateString("en-GB") : "—",
  }));

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Expired IDs · ${rows.length} rows`,
    request: req,
  });

  return respondReport({
    title: "Expired ID Cards Report",
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",           key: "no",         width: "5%",  align: "right" },
      { header: "Name",        key: "name",       width: "26%" },
      { header: "NIC",         key: "nic",        width: "16%", mono: true },
      { header: "Employee ID", key: "employeeId", width: "15%", mono: true },
      { header: "Contractor",  key: "contractor", width: "20%" },
      { header: "Trade",       key: "trade",      width: "10%" },
      { header: "Expired On",  key: "expiredOn",  width: "8%" },
    ],
    rows,
    summary: [{ label: "Expired IDs", value: rows.length }],
    sheetName: "Expired IDs",
  }, format);
}
