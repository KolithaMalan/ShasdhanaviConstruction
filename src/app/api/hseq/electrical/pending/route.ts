import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { ElectricalEquipmentModel } from "@/models/ElectricalEquipment";
import { serializeElectricalEquipment } from "@/lib/tools";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(["HSEQ_OFFICER", "SUPER_ADMIN"]);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const contractor = searchParams.get("contractor")?.trim();

  const filter: Record<string, unknown> = { inspectionStatus: "PENDING_INSPECTION" };
  if (contractor) filter.companyName = contractor;
  if (q) {
    filter.$or = [
      { toolName: { $regex: q, $options: "i" } },
      { equipmentId: { $regex: q.toUpperCase(), $options: "i" } },
      { serialNumber: { $regex: q, $options: "i" } },
    ];
  }

  await connectDB();
  const docs = await ElectricalEquipmentModel.find(filter).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ items: docs.map(serializeElectricalEquipment) });
}
