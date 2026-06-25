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
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");
  const entityType = searchParams.get("entityType");
  const direction = searchParams.get("direction");
  const contractor = searchParams.get("contractor")?.trim();
  const format = parseFormat(req);

  const now = new Date();
  const start = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endParam ? new Date(endParam) : now;
  end.setHours(23, 59, 59, 999);

  const filter: Record<string, unknown> = { scannedAt: { $gte: start, $lte: end } };
  if (entityType && ["EMPLOYEE", "VEHICLE", "VISITOR"].includes(entityType)) filter.entityType = entityType;
  if (direction && ["IN", "OUT"].includes(direction)) filter.direction = direction;
  if (contractor) filter.companyName = contractor;

  await connectDB();
  const docs = await MovementLogModel.find(filter).sort({ scannedAt: -1 }).limit(5000).lean();

  const rows: ReportRow[] = docs.map((d, i) => ({
    no: i + 1,
    date: new Date(d.scannedAt).toLocaleDateString("en-GB"),
    time: new Date(d.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    type: d.entityType,
    direction: d.direction,
    name: d.entityName,
    identifier: d.entityIdentifier,
    contractor: d.companyName ?? "—",
    gate: d.gateLocation,
    officer: d.scannedByName,
  }));

  void logAction({
    userId: guard.session.user.id, userName: guard.session.user.name ?? "",
    userEmail: guard.session.user.email ?? "", userRole: guard.session.user.role,
    action: "DOWNLOAD_REPORT", entityType: "Report",
    description: `Movement Log · ${rows.length} rows (${format})`,
    request: req,
  });

  return respondReport({
    title: "Movement Log Report",
    subtitle: `${start.toLocaleDateString("en-GB")} → ${end.toLocaleDateString("en-GB")}`,
    filters: [
      entityType ? `Type: ${entityType}` : null,
      direction ? `Direction: ${direction}` : null,
      contractor ? `Contractor: ${contractor}` : null,
    ].filter(Boolean).join(" · ") || undefined,
    generatedBy: guard.session.user.name ?? undefined,
    columns: [
      { header: "#",          key: "no",         width: "4%",  align: "right" },
      { header: "Date",       key: "date",       width: "9%" },
      { header: "Time",       key: "time",       width: "7%",  mono: true },
      { header: "Type",       key: "type",       width: "10%" },
      { header: "Direction",  key: "direction",  width: "8%" },
      { header: "Name",       key: "name",       width: "20%" },
      { header: "Identifier", key: "identifier", width: "13%", mono: true },
      { header: "Contractor", key: "contractor", width: "14%" },
      { header: "Gate",       key: "gate",       width: "8%" },
      { header: "Officer",    key: "officer",    width: "7%" },
    ],
    rows,
    summary: [
      { label: "Movements", value: rows.length },
      { label: "From", value: start.toLocaleDateString("en-GB") },
      { label: "To",   value: end.toLocaleDateString("en-GB") },
    ],
    orientation: "landscape",
    sheetName: "Movement Log",
  }, format);
}
