import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const contractor = searchParams.get("contractor")?.trim();
  const format = parseFormat(req);

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  await connectDB();
  const filter: Record<string, unknown> = {
    entityType: "EMPLOYEE",
    scannedAt: { $gte: dayStart, $lte: dayEnd },
  };
  if (contractor) filter.companyName = contractor;

  const docs = await MovementLogModel.find(filter).sort({ scannedAt: 1 }).lean();

  /* For each employee, take first IN of day and last OUT of day */
  const byEmployee = new Map<string, {
    name: string; nic: string; company: string;
    firstIn: Date | null; lastOut: Date | null;
  }>();

  for (const d of docs) {
    const key = String(d.employeeId ?? d.entityIdentifier);
    const entry = byEmployee.get(key) ?? {
      name: d.entityName, nic: d.entityIdentifier, company: d.companyName,
      firstIn: null, lastOut: null,
    };
    if (d.direction === "IN" && !entry.firstIn) entry.firstIn = d.scannedAt;
    if (d.direction === "OUT") entry.lastOut = d.scannedAt;
    byEmployee.set(key, entry);
  }

  const rows: ReportRow[] = Array.from(byEmployee.values()).map((e, i) => {
    let hours = "—";
    if (e.firstIn && e.lastOut) {
      const ms = e.lastOut.getTime() - e.firstIn.getTime();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      hours = `${h}h ${m}m`;
    }
    return {
      no: i + 1,
      name: e.name,
      nic: e.nic,
      contractor: e.company,
      firstIn: e.firstIn ? new Date(e.firstIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
      lastOut: e.lastOut ? new Date(e.lastOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
      hours,
    };
  });

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Daily Attendance · ${date} · ${rows.length} rows (${format})`,
    request: req,
  });

  return respondReport({
    title: "Daily Attendance Report",
    subtitle: `Date: ${dayStart.toLocaleDateString("en-GB")}`,
    filters: contractor ? `Contractor: ${contractor}` : undefined,
    generatedBy: guard.session.user.name ?? guard.session.user.email ?? undefined,
    columns: [
      { header: "#",          key: "no",         width: "5%",  align: "right" },
      { header: "Name",       key: "name",       width: "25%" },
      { header: "NIC",        key: "nic",        width: "15%", mono: true },
      { header: "Contractor", key: "contractor", width: "25%" },
      { header: "First IN",   key: "firstIn",    width: "10%", mono: true },
      { header: "Last OUT",   key: "lastOut",    width: "10%", mono: true },
      { header: "Hours",      key: "hours",      width: "10%", align: "right" },
    ],
    rows,
    summary: [
      { label: "Employees Present", value: rows.length },
      { label: "Date", value: dayStart.toLocaleDateString("en-GB") },
    ],
    orientation: "landscape",
    sheetName: "Daily Attendance",
  }, format);
}
