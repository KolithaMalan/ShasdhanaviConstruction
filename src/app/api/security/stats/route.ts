import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MovementLogModel } from "@/models/MovementLog";
import { EmployeeModel } from "@/models/Employee";
import { VehicleModel } from "@/models/Vehicle";
import { VisitorModel } from "@/models/Visitor";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["SECURITY_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    scansToday, inToday, outToday,
    employeesInside, vehiclesInside, visitorsInside,
  ] = await Promise.all([
    MovementLogModel.countDocuments({ scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ direction: "IN",  scannedAt: { $gte: startOfDay } }),
    MovementLogModel.countDocuments({ direction: "OUT", scannedAt: { $gte: startOfDay } }),
    EmployeeModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),
    VehicleModel.countDocuments({ currentStatus: "IN", status: "ACTIVE" }),
    VisitorModel.countDocuments({ currentStatus: "IN" }),
  ]);

  return NextResponse.json({
    scansToday, inToday, outToday,
    insideTotals: {
      employees: employeesInside,
      vehicles: vehiclesInside,
      visitors: visitorsInside,
      all: employeesInside + vehiclesInside + visitorsInside,
    },
  });
}
