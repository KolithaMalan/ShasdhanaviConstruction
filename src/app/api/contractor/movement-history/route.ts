import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Combined recent-movements feed for the contractor dashboard.
 * Phase 4: backed by real MovementLog data, scoped to the contractor.
 */
export async function GET() {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const [employees, vehicles] = await Promise.all([
    MovementLogModel.find({ entityType: "EMPLOYEE", contractorId: guard.session.user.id })
      .sort({ scannedAt: -1 }).limit(50).lean(),
    MovementLogModel.find({ entityType: "VEHICLE", contractorId: guard.session.user.id })
      .sort({ scannedAt: -1 }).limit(50).lean(),
  ]);

  return NextResponse.json({
    employees: employees.map((d) => ({
      id: String(d._id),
      name: d.entityName,
      nicNumber: d.entityIdentifier,
      direction: d.direction,
      scannedAt: d.scannedAt,
      gateLocation: d.gateLocation,
      officerName: d.scannedByName,
    })),
    vehicles: vehicles.map((d) => ({
      id: String(d._id),
      vehicleNumber: d.entityName,
      direction: d.direction,
      scannedAt: d.scannedAt,
      gateLocation: d.gateLocation,
      officerName: d.scannedByName,
    })),
  });
}
