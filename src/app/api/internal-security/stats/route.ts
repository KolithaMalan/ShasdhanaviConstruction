import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ToolMovementModel } from "@/models/ToolMovement";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireRole(["INTERNAL_SECURITY", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  await connectDB();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [inToday, outToday, gatePassesAgg, activeContractorsAgg] = await Promise.all([
    ToolMovementModel.countDocuments({ direction: "IN",  processedAt: { $gte: startOfDay } }),
    ToolMovementModel.countDocuments({ direction: "OUT", processedAt: { $gte: startOfDay } }),
    ToolMovementModel.aggregate([
      { $match: { processedAt: { $gte: startOfDay } } },
      { $group: { _id: "$gatePassId" } },
      { $count: "n" },
    ]),
    ToolMovementModel.aggregate([
      { $group: { _id: "$contractorId" } },
      { $count: "n" },
    ]),
  ]);

  return NextResponse.json({
    inToday,
    outToday,
    gatePassesToday: gatePassesAgg[0]?.n ?? 0,
    activeContractors: activeContractorsAgg[0]?.n ?? 0,
  });
}
