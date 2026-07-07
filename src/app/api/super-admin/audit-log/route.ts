import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";
import { AUDIT_ACTIONS } from "@/types";
import { requireRole } from "@/lib/api";
import { logAction } from "@/lib/auditLogger";
import { respondReport, parseFormat, type ReportRow } from "@/lib/reportFormatters";

export const runtime = "nodejs";

/** Hard cap on rows pulled into a single export file. */
const EXPORT_LIMIT = 5000;

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const userEmail = searchParams.get("userEmail")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100));
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const format = parseFormat(req);

  const filter: Record<string, unknown> = {};
  if (action && AUDIT_ACTIONS.includes(action as never)) filter.action = action;
  if (userEmail) filter.userEmail = { $regex: userEmail, $options: "i" };
  if (startDate || endDate) {
    const range: Record<string, Date> = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); range.$lte = e; }
    filter.createdAt = range;
  }

  await connectDB();

  /* ── Export (Excel / PDF) — filtered, un-paginated up to the cap ── */
  if (format !== "json") {
    const docs = await AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(EXPORT_LIMIT)
      .lean();

    const rows: ReportRow[] = docs.map((d, i) => ({
      no: i + 1,
      timestamp: new Date((d as unknown as { createdAt: Date }).createdAt).toLocaleString("en-GB"),
      user: d.userName || d.userEmail || "—",
      email: d.userEmail || "—",
      role: d.userRole || "—",
      action: d.action.replace(/_/g, " "),
      description: d.description || "—",
      entity: d.entityType ? `${d.entityType}/${d.entityId || "*"}` : "—",
      ip: d.ipAddress || "—",
    }));

    void logAction({
      userId: guard.session.user.id,
      userName: guard.session.user.name ?? "",
      userEmail: guard.session.user.email ?? "",
      userRole: guard.session.user.role,
      action: "DOWNLOAD_REPORT",
      entityType: "AuditLog",
      description: `Audit Log export · ${rows.length} rows (${format})`,
      request: req,
    });

    const rangeLabel = [
      startDate ? `From ${new Date(startDate).toLocaleDateString("en-GB")}` : null,
      endDate ? `To ${new Date(endDate).toLocaleDateString("en-GB")}` : null,
      action && action !== "ALL" ? `Action: ${action}` : null,
      userEmail ? `Email: ${userEmail}` : null,
    ].filter(Boolean).join(" · ");

    return respondReport({
      title: "Audit Log",
      subtitle: `${rows.length} record${rows.length === 1 ? "" : "s"}`,
      filters: rangeLabel || undefined,
      generatedBy: guard.session.user.name ?? guard.session.user.email ?? undefined,
      columns: [
        { header: "#",           key: "no",          width: "4%",  align: "right" },
        { header: "Timestamp",   key: "timestamp",   width: "14%", mono: true },
        { header: "User",        key: "user",        width: "13%" },
        { header: "Email",       key: "email",       width: "15%", mono: true },
        { header: "Role",        key: "role",        width: "10%", mono: true },
        { header: "Action",      key: "action",      width: "10%" },
        { header: "Description", key: "description",  width: "20%" },
        { header: "Entity",      key: "entity",      width: "9%",  mono: true },
        { header: "IP",          key: "ip",          width: "5%",  mono: true },
      ],
      rows,
      summary: [{ label: "Total Records", value: rows.length }],
      orientation: "landscape",
      sheetName: "Audit Log",
    }, format);
  }

  const [items, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: items.map((d) => ({
      id: String(d._id),
      userId: String(d.userId),
      userName: d.userName,
      userEmail: d.userEmail,
      userRole: d.userRole,
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId,
      description: d.description,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      createdAt: (d as unknown as { createdAt: Date }).createdAt,
    })),
    total,
    page,
    limit,
  });
}
