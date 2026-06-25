import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { requireRole } from "@/lib/api";
import {
  ELECTRICAL_INSPECTION_STATUSES,
  ELECTRICAL_LIFECYCLE_STATUSES,
} from "@/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["SUPER_ADMIN", "ADMIN_HSEQ"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const contractor = searchParams.get("contractor")?.trim();
  const inspectionStatus = searchParams.get("inspectionStatus");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const filter: Record<string, unknown> = {};
  if (contractor) filter.companyName = contractor;
  if (inspectionStatus && ELECTRICAL_INSPECTION_STATUSES.includes(inspectionStatus as never)) {
    filter.inspectionStatus = inspectionStatus;
  }
  if (status && ELECTRICAL_LIFECYCLE_STATUSES.includes(status as never)) filter.status = status;
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { equipmentId: { $regex: q.toUpperCase(), $options: "i" } },
      { companyName: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await ElectricalEquipmentModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ items: docs.map(serializeElectricalEquipment) });
}
