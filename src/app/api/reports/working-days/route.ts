import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
import { MovementLogModel } from "@/models/MovementLog";
import { UserModel } from "@/models/User";
import { localDateKey } from "@/lib/working-days";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const contractorId = searchParams.get("contractor")?.trim();
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const format = parseFormat(req);

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startParam ? new Date(startParam) : defaultStart;
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  await connectDB();

  const empFilter: Record<string, unknown> = {};
  let contractorName = "All contractors";
  if (contractorId) {
    empFilter.contractorId = contractorId;
    const c = await UserModel.findById(contractorId).select("companyName name").lean();
    contractorName = c?.companyName ?? c?.name ?? "Contractor";
  }
  const employees = await EmployeeModel.find(empFilter).select("name nicNumber tradeType employeeId companyName _id").lean();

  const scans = await MovementLogModel.find({
    entityType: "EMPLOYEE",
    employeeId: { $in: employees.map((e) => e._id) },
    direction: "IN",
    scannedAt: { $gte: start, $lte: end },
  }).select("employeeId scannedAt").lean();

  const days = new Map<string, Set<string>>();
  for (const s of scans) {
    const key = String(s.employeeId);
    const set = days.get(key) ?? new Set<string>();
    set.add(localDateKey(s.scannedAt));
    days.set(key, set);
  }

  const rows: ReportRow[] = employees.map((e, i) => ({
    no: i + 1,
    name: e.name,
    nic: e.nicNumber,
    employeeId: e.employeeId ?? "—",
    contractor: e.companyName,
    trade: e.tradeType,
    days: days.get(String(e._id))?.size ?? 0,
  }));

  const totalDays = rows.reduce((s, r) => s + (Number(r.days) || 0), 0);

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Working Days · ${start.toISOString().slice(0,10)} → ${end.toISOString().slice(0,10)}`,
    request: req,
  });

  return respondReport({
    title: "Working Days Report",
    subtitle: `${start.toLocaleDateString("en-GB")} → ${end.toLocaleDateString("en-GB")}`,
    filters: `Contractor: ${contractorName}`,
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",          key: "no",         width: "5%",  align: "right" },
      { header: "Name",       key: "name",       width: "22%" },
      { header: "NIC",        key: "nic",        width: "15%", mono: true },
      { header: "Employee ID",key: "employeeId", width: "15%", mono: true },
      { header: "Contractor", key: "contractor", width: "20%" },
      { header: "Trade",      key: "trade",      width: "13%" },
      { header: "Days",       key: "days",       width: "10%", align: "right" },
    ],
    rows,
    summary: [
      { label: "Employees",          value: rows.length },
      { label: "Total Working Days", value: totalDays },
    ],
    orientation: "landscape",
    sheetName: "Working Days",
  }, format);
}
