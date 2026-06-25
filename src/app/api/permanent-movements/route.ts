import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { PermanentEmployeeModel } from "@/models/PermanentEmployee";
import { requireRole } from "@/lib/api";
import { SCAN_DIRECTIONS } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SECURITY_OFFICER", "ADMIN_HSEQ", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const q = searchParams.get("q")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filter: Record<string, unknown> = { entityType: "PERMANENT" };
  if (direction && SCAN_DIRECTIONS.includes(direction as never)) filter.direction = direction;
  if (q) {
    filter.$or = [
      { entityName: { $regex: q, $options: "i" } },
      { entityIdentifier: { $regex: q, $options: "i" } },
    ];
  }
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
  const [docs, insideNow] = await Promise.all([
    MovementLogModel.find(filter).sort({ scannedAt: -1 }).limit(1000).lean(),
    PermanentEmployeeModel.countDocuments({ currentStatus: "IN" }),
  ]);

  return NextResponse.json({
    insideNow,
    items: docs.map((d) => ({
      id: String(d._id),
      name: d.entityName,
      identifier: d.entityIdentifier,
      direction: d.direction,
      scannedAt: d.scannedAt,
      gateLocation: d.gateLocation,
      scannedByName: d.scannedByName ?? "",
    })),
  });
}
