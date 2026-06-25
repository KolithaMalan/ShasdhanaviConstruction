import { connectDB } from "@/lib/db";
import { EmployeeModel } from "@/models/Employee";
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
  const status = searchParams.get("status");
  const format = parseFormat(req);

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  const filter: Record<string, unknown> = {
    medicalScreenedAt: { $gte: start, $lte: end },
    medicalStatus: { $in: ["PASSED", "FAILED"] },
  };
  if (status === "PASSED" || status === "FAILED") filter.medicalStatus = status;

  await connectDB();
  const docs = await EmployeeModel.find(filter).sort({ medicalScreenedAt: -1 }).lean();

  const rows: ReportRow[] = docs.map((d, i) => ({
    no: i + 1,
    name: d.name,
    nic: d.nicNumber,
    contractor: d.companyName,
    trade: d.tradeType,
    result: d.medicalStatus,
    bloodType: d.bloodType ?? "—",
    documentId: d.medicalDocumentId || "—",
    rejectionReason: d.medicalRejectionReason || "—",
    screenedAt: d.medicalScreenedAt
      ? new Date(d.medicalScreenedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
      : "—",
  }));

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Medical Screenings · ${rows.length} rows`,
    request: req,
  });

  return respondReport({
    title: "Medical Screening Report",
    subtitle: `${start.toLocaleDateString("en-GB")} → ${end.toLocaleDateString("en-GB")}`,
    filters: status ? `Result: ${status}` : undefined,
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",            key: "no",              width: "4%",  align: "right" },
      { header: "Name",         key: "name",            width: "18%" },
      { header: "NIC",          key: "nic",             width: "12%", mono: true },
      { header: "Contractor",   key: "contractor",      width: "18%" },
      { header: "Trade",        key: "trade",           width: "10%" },
      { header: "Result",       key: "result",          width: "7%" },
      { header: "Blood",        key: "bloodType",       width: "6%",  align: "center" },
      { header: "Doc ID",       key: "documentId",      width: "8%",  mono: true },
      { header: "Reason",       key: "rejectionReason", width: "10%" },
      { header: "Screened",     key: "screenedAt",      width: "7%" },
    ],
    rows,
    summary: [
      { label: "Total",  value: rows.length },
      { label: "Passed", value: rows.filter((r) => r.result === "PASSED").length },
      { label: "Failed", value: rows.filter((r) => r.result === "FAILED").length },
    ],
    orientation: "landscape",
    sheetName: "Medical Screenings",
  }, format);
}
