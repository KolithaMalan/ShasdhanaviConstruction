import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Returns hourly site occupancy for today (06:00 → 22:00).
 * Computed as a running sum of IN − OUT for each entity type per hour.
 */
export async function GET() {
  const guard = await requireRole(["SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const logs = await MovementLogModel.find({ scannedAt: { $gte: startOfDay } })
    .select("entityType direction scannedAt")
    .sort({ scannedAt: 1 })
    .lean();

  const hourly: { hour: string; employees: number; vehicles: number; visitors: number }[] = [];
  let emp = 0, veh = 0, vis = 0;

  for (let h = 6; h <= 22; h += 1) {
    const cutoff = new Date(startOfDay);
    cutoff.setHours(h + 1, 0, 0, 0);
    for (const l of logs) {
      if (new Date(l.scannedAt).getTime() > cutoff.getTime()) break;
      const inc = l.direction === "IN" ? 1 : -1;
      if (l.entityType === "EMPLOYEE") emp += inc;
      else if (l.entityType === "VEHICLE") veh += inc;
      else if (l.entityType === "VISITOR") vis += inc;
    }
    hourly.push({
      hour: `${String(h).padStart(2, "0")}:00`,
      employees: Math.max(0, emp),
      vehicles: Math.max(0, veh),
      visitors: Math.max(0, vis),
    });
    // Drop processed logs so they're not re-counted next hour
    while (logs.length && new Date(logs[0]!.scannedAt).getTime() <= cutoff.getTime()) {
      logs.shift();
    }
    emp = Math.max(0, emp);
    veh = Math.max(0, veh);
    vis = Math.max(0, vis);
  }

  return NextResponse.json({ items: hourly });
}
