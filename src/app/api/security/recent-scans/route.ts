import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

  await connectDB();
  const docs = await MovementLogModel.find({})
    .sort({ scannedAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      entityType: d.entityType,
      entityName: d.entityName,
      entityIdentifier: d.entityIdentifier,
      companyName: d.companyName,
      direction: d.direction,
      gateLocation: d.gateLocation,
      scannedAt: d.scannedAt,
      scannedByName: d.scannedByName,
      scanMethod: d.scanMethod,
    })),
  });
}
