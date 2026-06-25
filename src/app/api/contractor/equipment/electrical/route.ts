import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["CONTRACTOR"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const inspectionStatus = searchParams.get("inspectionStatus");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = { contractorId: guard.session.user.id };
  if (inspectionStatus === "PENDING_INSPECTION" || inspectionStatus === "PASSED" || inspectionStatus === "FAILED") {
    filter.inspectionStatus = inspectionStatus;
  }
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { equipmentId: { $regex: q.toUpperCase(), $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await ElectricalEquipmentModel.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map(serializeElectricalEquipment) });
}
