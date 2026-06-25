import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // PASSED | FAILED
  const contractor = searchParams.get("contractor")?.trim();
  const q = searchParams.get("q")?.trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const filter: Record<string, unknown> = {
    inspectionStatus: { $in: ["PASSED", "FAILED"] },
  };
  if (status === "PASSED" || status === "FAILED") filter.inspectionStatus = status;
  if (contractor) filter.companyName = contractor;
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { equipmentId: { $regex: q.toUpperCase(), $options: "i" } },
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
    filter.inspectedAt = range;
  }

  await connectDB();
  const docs = await ElectricalEquipmentModel.find(filter)
    .sort({ inspectedAt: -1 })
    .limit(500)
    .lean();
  return NextResponse.json({ items: docs.map(serializeElectricalEquipment) });
}
