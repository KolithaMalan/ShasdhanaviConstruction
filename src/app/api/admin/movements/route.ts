import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";
import { SCAN_DIRECTIONS } from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const direction = searchParams.get("direction");
  const contractor = searchParams.get("contractor")?.trim();
  const q = searchParams.get("q")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  /* This view covers contractor traffic only — permanent staff have their
     own dedicated "Permanent Movements" page. */
  const CONTRACTOR_TYPES = ["EMPLOYEE", "VEHICLE", "VISITOR"];
  const filter: Record<string, unknown> = { entityType: { $in: CONTRACTOR_TYPES } };
  if (entityType && CONTRACTOR_TYPES.includes(entityType)) filter.entityType = entityType;
  if (direction && SCAN_DIRECTIONS.includes(direction as never)) filter.direction = direction;
  if (contractor) filter.companyName = { $regex: contractor, $options: "i" };
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
  const docs = await MovementLogModel.find(filter).sort({ scannedAt: -1 }).limit(1000).lean();

  return NextResponse.json({
    items: docs.map((d) => ({
      id: String(d._id),
      entityType: d.entityType,
      entityName: d.entityName,
      entityIdentifier: d.entityIdentifier,
      companyName: d.companyName ?? "",
      direction: d.direction,
      scannedAt: d.scannedAt,
      gateLocation: d.gateLocation,
      scannedByName: d.scannedByName ?? "",
      scanMethod: d.scanMethod,
      notes: d.notes ?? "",
    })),
  });
}
