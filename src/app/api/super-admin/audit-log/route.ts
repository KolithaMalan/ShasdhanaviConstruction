import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";
import { AUDIT_ACTIONS } from "@/types";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

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
