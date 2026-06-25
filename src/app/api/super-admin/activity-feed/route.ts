import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

  await connectDB();
  const docs = await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId,
      description: d.description,
      userName: d.userName,
      userEmail: d.userEmail,
      userRole: d.userRole,
      createdAt: (d as unknown as { createdAt: Date }).createdAt,
    })),
  });
}
