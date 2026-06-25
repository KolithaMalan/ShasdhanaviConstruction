import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filter: Record<string, unknown> = {
    entityType: "VEHICLE",
    contractorId: guard.session.user.id,
  };
  if (startDate || endDate) {
    const range: Record<string, Date> = {};
    if (startDate) range.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    filter.scannedAt = range;
  }

  await connectDB();
  const docs = await MovementLogModel.find(filter).sort({ scannedAt: -1 }).limit(1000).lean();
  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      vehicleNumber: d.entityName,
      direction: d.direction,
      scannedAt: d.scannedAt,
      gateLocation: d.gateLocation,
      officerName: d.scannedByName,
    })),
  });
}
